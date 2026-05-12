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
        path = Path(model_path or settings.model_path)
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
            "Loaded model v%s from %s",
            self.metadata.get("model_version", "unknown") if self.metadata else "?",
            path,
        )

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def version(self) -> str:
        if self.metadata:
            return self.metadata.get("model_version", "unknown")
        return settings.model_version

    def predict(self, features: dict) -> dict:
        """
        Predict dropout risk for a single student.

        Args:
            features: Dict with keys matching OULAD feature names.

        Returns:
            Dict with risk_score, risk_level, and feature_contributions.
        """
        if not self._loaded:
            return self._demo_predict(features)

        df = pd.DataFrame([features])

        # Ensure all expected columns exist
        expected = self.metadata["features"] if self.metadata else []
        for col in expected:
            if col not in df.columns:
                df[col] = np.nan

        risk_score = float(self.model.predict_proba(df[expected])[:, 1][0])
        risk_level = self._score_to_level(risk_score)

        contributions = self._compute_contributions(df[expected])

        return {
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "model_version": self.version,
            "features": contributions,
        }

    def predict_batch(self, features_list: list[dict]) -> list[dict]:
        """Predict for multiple students."""
        return [self.predict(f) for f in features_list]

    def _compute_contributions(self, df: pd.DataFrame) -> list[dict]:
        """Compute per-feature contribution using model coefficients."""
        if not self.metadata or "coefficients" not in self.metadata:
            return []

        coefficients = np.array(self.metadata["coefficients"])
        feature_names = self.metadata.get("feature_names_transformed", [])

        # Transform features through the preprocessor
        preprocessor = self.model.named_steps["preprocessor"]
        X_transformed = preprocessor.transform(df)

        # Element-wise contribution: coefficient * feature_value
        contributions_raw = coefficients * X_transformed[0]

        # Map back to original feature groups and aggregate
        numeric_features = self.metadata["features"][:11]  # first 11 are numeric
        results = []

        for i, feat in enumerate(numeric_features):
            if i < len(contributions_raw):
                val = float(df.iloc[0].get(feat, 0) or 0)
                contrib = float(contributions_raw[i])
                results.append({
                    "feature": feat,
                    "value": val,
                    "contribution": round(abs(contrib), 4),
                    "direction": "risk" if contrib > 0 else "protective",
                })

        # Sort by absolute contribution, return top 10
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
        """Deterministic demo prediction when no model is loaded."""
        # Simple heuristic based on key features for demo mode
        score = 0.3
        clicks = features.get("total_clicks", 0)
        assess = features.get("assessment_score_avg", 50)
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
                {"feature": "total_clicks", "value": clicks,
                 "contribution": 0.3, "direction": "risk" if clicks < 100 else "protective"},
                {"feature": "assessment_score_avg", "value": assess or 0,
                 "contribution": 0.25, "direction": "risk" if (assess or 50) < 40 else "protective"},
                {"feature": "num_of_prev_attempts", "value": prev_attempts,
                 "contribution": 0.15, "direction": "risk" if prev_attempts > 1 else "protective"},
            ],
        }


# Singleton instance — loaded once at startup
predictor = RetentionPredictor()
