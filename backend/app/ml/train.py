"""
Train the student retention prediction model on OULAD data.

This script reproduces the logistic regression pipeline (AUC 0.877)
and serialises it for serving via the FastAPI prediction endpoint.

Run: python -m app.ml.train
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Feature definitions matching the OULAD dataset
NUMERIC_FEATURES = [
    "num_of_prev_attempts",
    "studied_credits",
    "total_clicks",
    "avg_daily_clicks",
    "days_active",
    "assessment_score_avg",
    "assessment_score_std",
    "assessments_submitted",
    "assessments_total",
    "first_activity_day",
    "last_activity_day",
]

CATEGORICAL_FEATURES = [
    "gender",
    "region",
    "highest_education",
    "imd_band",
    "age_band",
    "disability",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def build_pipeline() -> Pipeline:
    """Build the scikit-learn preprocessing + model pipeline."""
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    C=0.1,
                    max_iter=1000,
                    class_weight="balanced",
                    solver="lbfgs",
                    random_state=42,
                ),
            ),
        ]
    )
    return pipeline


def train(data_path: str = "data/oulad_features.csv") -> None:
    """Train the model and save artifacts."""
    logger.info("Loading training data from %s", data_path)
    df = pd.read_csv(data_path)

    # Binary target: 1 = at risk (Fail or Withdrawn), 0 = on track (Pass or Distinction)
    df["target"] = df["final_result"].isin(["Fail", "Withdrawn"]).astype(int)

    X = df[ALL_FEATURES]
    y = df["target"]

    logger.info("Dataset: %d rows, %d features, %.1f%% positive class",
                len(df), len(ALL_FEATURES), y.mean() * 100)

    # Build and cross-validate
    pipeline = build_pipeline()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="roc_auc")

    logger.info("Cross-validated AUC: %.3f ± %.3f", cv_scores.mean(), cv_scores.std())

    # Bootstrap confidence interval
    n_bootstrap = 1000
    rng = np.random.RandomState(42)
    boot_aucs = []
    for _ in range(n_bootstrap):
        idx = rng.choice(len(y), size=len(y), replace=True)
        X_boot, y_boot = X.iloc[idx], y.iloc[idx]
        pipeline_boot = build_pipeline()
        pipeline_boot.fit(X_boot, y_boot)
        pred = pipeline_boot.predict_proba(X.iloc[~np.isin(np.arange(len(y)), idx)])
        y_oob = y.iloc[~np.isin(np.arange(len(y)), idx)]
        if len(y_oob) > 0 and y_oob.nunique() > 1:
            boot_aucs.append(roc_auc_score(y_oob, pred[:, 1]))

    ci_lower, ci_upper = np.percentile(boot_aucs, [2.5, 97.5])
    logger.info("Bootstrap 95%% CI: [%.3f, %.3f]", ci_lower, ci_upper)

    # Final fit on full data
    pipeline.fit(X, y)
    y_pred_proba = pipeline.predict_proba(X)[:, 1]
    y_pred = pipeline.predict(X)

    logger.info("Final model AUC (train): %.3f", roc_auc_score(y, y_pred_proba))
    logger.info("\n%s", classification_report(y, y_pred))

    # Extract feature names after one-hot encoding
    cat_encoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    ohe = cat_encoder.named_steps["encoder"]
    cat_feature_names = list(ohe.get_feature_names_out(CATEGORICAL_FEATURES))
    all_feature_names = NUMERIC_FEATURES + cat_feature_names

    # Save model and metadata
    output_dir = Path("app/ml")
    output_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(pipeline, output_dir / "model.joblib")
    logger.info("Model saved to %s", output_dir / "model.joblib")

    metadata = {
        "model_version": "1.0.0",
        "algorithm": "LogisticRegression",
        "features": ALL_FEATURES,
        "feature_names_transformed": all_feature_names,
        "cv_auc_mean": float(cv_scores.mean()),
        "cv_auc_std": float(cv_scores.std()),
        "bootstrap_ci_95": [float(ci_lower), float(ci_upper)],
        "class_labels": ["on_track", "at_risk"],
        "coefficients": pipeline.named_steps["classifier"].coef_[0].tolist(),
    }
    with open(output_dir / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Metadata saved to %s", output_dir / "model_metadata.json")


if __name__ == "__main__":
    train()
