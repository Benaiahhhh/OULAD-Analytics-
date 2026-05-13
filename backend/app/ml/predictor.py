"""ML model serving — load once at startup, predict on demand."""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RetentionPredictor:
    """Wraps the trained scikit-learn pipeline for serving predictions."""

    def __init__(self):
        self.model = None
        self.metadata = None
        self._loaded = False

    def load(self, model_path: str | None = None) -> None:
        path = Path(model_path or settings.ml_model_path)
        meta_path = path.parent / "model_metadata.json"

        if not path.exists():
            logger.warning("Model file not found at %s — using demo mode", path)
            self._loaded = False
            return

        self.model = joblib.load(path)
        if meta_path.exists():
            with open(meta_path) as f:
                self.metadata = json.load(f)

        self._loaded = True
        logger.info(
            "Loaded model v%s from %s (AUC: %s)",
            self.metadata.get("model_version", "unknown") if self.metadata else "?",
            path,
            self.metadata.get("test_auc", "?") if self.metadata else "?",
        )

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def version(self) -> str:
        if self.metadata:
            return self.metadata.get("model_version", "unknown")
        return settings.ml_model_version

    def predict(self, features: dict) -> dict:
        if not self._loaded:
            return self._demo_predict(features)

        feature_names = self.metadata["feature_names"]
        row = self._build_feature_row(features, feature_names)
        df = pd.DataFrame([row], columns=feature_names)

        risk_score = float(self.model.predict_proba(df)[:, 1][0])
        risk_level = self._score_to_level(risk_score)
        contributions = self._compute_contributions(df, feature_names)

        return {
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "model_version": self.version,
            "features": contributions,
        }

    def predict_batch(self, features_list: list[dict]) -> list[dict]:
        return [self.predict(f) for f in features_list]

    def _build_feature_row(self, features: dict, feature_names: list) -> list:
        row = {}

        # Numeric features — map from DB column names to model feature names
        numeric_map = {
            "num_of_prev_attempts": "num_of_prev_attempts",
            "studied_credits": "studied_credits",
            "assessment_score_avg": "av_score",
            "av_score": "av_score",
            "assessment_score_std": "std_score",
            "std_score": "std_score",
            "late_submission_rate": "late_submission_rate",
            "assessments_submitted": "num_assessments_completed",
            "num_assessments_completed": "num_assessments_completed",
            "total_clicks": "total_clicks",
            "days_active": "active_days",
            "active_days": "active_days",
            "early_clicks": "early_clicks",
        }

        for input_name, model_name in numeric_map.items():
            if input_name in features and model_name not in row:
                val = features[input_name]
                row[model_name] = float(val) if val is not None else 0.0

        for feat in ["num_of_prev_attempts", "studied_credits", "av_score",
                      "std_score", "late_submission_rate", "num_assessments_completed",
                      "total_clicks", "active_days", "early_clicks"]:
            if feat not in row:
                row[feat] = 0.0

        # Categorical — one-hot encode to match training (drop_first)
        education = features.get("highest_education", "")
        for cat in ["HE Qualification", "Lower Than A Level",
                     "No Formal quals", "Post Graduate Qualification"]:
            row[f"highest_education_{cat}"] = 1.0 if education == cat else 0.0

        imd = features.get("imd_band", "")
        for cat in ["10-20", "20-30%", "30-40%", "40-50%", "50-60%",
                     "60-70%", "70-80%", "80-90%", "90-100%", "?"]:
            row[f"imd_band_{cat}"] = 1.0 if imd and (imd.replace("%", "") == cat.replace("%", "")) else 0.0

        age = features.get("age_band", "")
        row["age_band_35-55"] = 1.0 if age == "35-55" else 0.0
        row["age_band_55<="] = 1.0 if age == "55<=" else 0.0

        disability = features.get("disability", "N")
        row["disability_Y"] = 1.0 if disability == "Y" else 0.0

        module = features.get("module_code", features.get("code_module", ""))
        for cat in ["BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]:
            row[f"code_module_{cat}"] = 1.0 if module == cat else 0.0

        return [row.get(feat, 0.0) for feat in feature_names]

    def _compute_contributions(self, df: pd.DataFrame, feature_names: list) -> list[dict]:
        if not self.metadata or "coefficients" not in self.metadata:
            return []

        coefficients = self.metadata["coefficients"]

        label_map = {
            "av_score": "Assessment Average",
            "std_score": "Score Consistency",
            "late_submission_rate": "Late Submission Rate",
            "num_assessments_completed": "Assessments Completed",
            "total_clicks": "Total VLE Clicks",
            "active_days": "Active Days",
            "early_clicks": "Early Engagement Clicks",
            "num_of_prev_attempts": "Previous Attempts",
            "studied_credits": "Credits Studied",
        }

        results = []
        for feat in feature_names:
            coef = coefficients.get(feat, 0)
            val = float(df[feat].iloc[0])
            contrib = coef * val

            if abs(contrib) < 0.001:
                continue

            label = label_map.get(feat, feat.replace("_", " ").title())
            results.append({
                "feature": feat,
                "label": label,
                "value": round(val, 4),
                "contribution": round(abs(contrib), 4),
                "direction": "risk" if contrib > 0 else "protective",
            })

        results.sort(key=lambda x: x["contribution"], reverse=True)
        return results[:10]

    @staticmethod
    def _score_to_level(score: float) -> str:
        if score >= 0.75:
            return "critical"
        elif score >= 0.50:
            return "high"
        elif score >= 0.30:
            return "medium"
        return "low"

    @staticmethod
    def _demo_predict(features: dict) -> dict:
        score = 0.3
        clicks = features.get("total_clicks", 0)
        assess = features.get("assessment_score_avg", features.get("av_score", 50))
        prev_attempts = features.get("num_of_prev_attempts", 0)

        if clicks < 100:
            score += 0.2
        if assess and assess < 40:
            score += 0.25
        if prev_attempts > 1:
            score += 0.15

        score = min(max(score, 0.05), 0.95)

        return {
            "risk_score": round(score, 4),
            "risk_level": RetentionPredictor._score_to_level(score),
            "model_version": "demo",
            "features": [
                {"feature": "total_clicks", "label": "Total VLE Clicks", "value": clicks,
                 "contribution": 0.3, "direction": "risk" if clicks < 100 else "protective"},
                {"feature": "av_score", "label": "Assessment Average", "value": assess or 0,
                 "contribution": 0.25, "direction": "risk" if (assess or 50) < 40 else "protective"},
                {"feature": "num_of_prev_attempts", "label": "Previous Attempts", "value": prev_attempts,
                 "contribution": 0.15, "direction": "risk" if prev_attempts > 1 else "protective"},
            ],
        }


predictor = RetentionPredictor()
