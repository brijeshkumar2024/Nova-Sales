"""
NovaSales - Forecasting Model Training
--------------------------------------
Models:
1. XGBoost
2. Prophet
3. Hybrid Ensemble

Evaluation:
- MAE
- RMSE
- MAPE

Uses strict chronological train/test split.
"""

from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor
from prophet import Prophet

warnings.filterwarnings("ignore")


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = PROJECT_ROOT / "data" / "processed" / "daily_sales.csv"
MODEL_DIR = PROJECT_ROOT / "models"
RESULT_DIR = PROJECT_ROOT / "data" / "processed"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

TEST_DAYS = 90


# ============================================================
# METRICS
# ============================================================

def calculate_mape(y_true, y_pred):
    """
    MAPE with zero-value protection.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    mask = y_true != 0

    if not np.any(mask):
        return 0.0

    return np.mean(
        np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])
    ) * 100


def evaluate_model(name, y_true, y_pred):
    """
    Calculate forecasting metrics.
    """

    mae = mean_absolute_error(y_true, y_pred)

    rmse = np.sqrt(
        mean_squared_error(y_true, y_pred)
    )

    mape = calculate_mape(y_true, y_pred)

    return {
        "model": name,
        "MAE": float(mae),
        "RMSE": float(rmse),
        "MAPE": float(mape),
    }


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def create_features(df):
    """
    Create lag, rolling and calendar features.
    """

    data = df.copy()

    data["date"] = pd.to_datetime(data["date"])

    data = data.sort_values("date").reset_index(drop=True)

    # Calendar features
    data["day_of_week"] = data["date"].dt.dayofweek
    data["day_of_month"] = data["date"].dt.day
    data["week_of_year"] = data["date"].dt.isocalendar().week.astype(int)
    data["month"] = data["date"].dt.month
    data["quarter"] = data["date"].dt.quarter
    data["year"] = data["date"].dt.year

    # Lag features
    data["lag_1"] = data["daily_sales_inr"].shift(1)
    data["lag_7"] = data["daily_sales_inr"].shift(7)
    data["lag_14"] = data["daily_sales_inr"].shift(14)
    data["lag_28"] = data["daily_sales_inr"].shift(28)

    # Rolling features
    data["rolling_7"] = (
        data["daily_sales_inr"]
        .shift(1)
        .rolling(7)
        .mean()
    )

    data["rolling_14"] = (
        data["daily_sales_inr"]
        .shift(1)
        .rolling(14)
        .mean()
    )

    data["rolling_28"] = (
        data["daily_sales_inr"]
        .shift(1)
        .rolling(28)
        .mean()
    )

    # Recent growth
    data["sales_growth_7d"] = (
        data["daily_sales_inr"].shift(1)
        / data["daily_sales_inr"].shift(8)
        - 1
    ) * 100

    # Drop rows created by lagging
    data = data.dropna().reset_index(drop=True)

    return data


# ============================================================
# XGBOOST
# ============================================================

def train_xgboost(train_df, test_df):

    feature_columns = [
        "daily_quantity",
        "daily_transactions",
        "active_products",
        "active_regions",
        "day_of_week",
        "day_of_month",
        "week_of_year",
        "month",
        "quarter",
        "year",
        "lag_1",
        "lag_7",
        "lag_14",
        "lag_28",
        "rolling_7",
        "rolling_14",
        "rolling_28",
        "sales_growth_7d",
    ]

    X_train = train_df[feature_columns]
    y_train = train_df["daily_sales_inr"]

    X_test = test_df[feature_columns]
    y_test = test_df["daily_sales_inr"]

    model = XGBRegressor(
        n_estimators=700,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )

    print("\nTraining XGBoost...")

    model.fit(
        X_train,
        y_train,
        verbose=False,
    )

    predictions = model.predict(X_test)

    metrics = evaluate_model(
        "XGBoost",
        y_test,
        predictions,
    )

    joblib.dump(
        {
            "model": model,
            "features": feature_columns,
        },
        MODEL_DIR / "xgboost_sales_forecaster.joblib",
    )

    return predictions, metrics


# ============================================================
# PROPHET
# ============================================================

def train_prophet(train_df, test_df):

    print("\nTraining Prophet...")

    prophet_train = train_df[
        ["date", "daily_sales_inr"]
    ].rename(
        columns={
            "date": "ds",
            "daily_sales_inr": "y",
        }
    )

    prophet_test = test_df[
        ["date", "daily_sales_inr"]
    ].rename(
        columns={
            "date": "ds",
            "daily_sales_inr": "y",
        }
    )

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        changepoint_prior_scale=0.05,
    )

    model.fit(prophet_train)

    forecast = model.predict(
        prophet_test[["ds"]]
    )

    predictions = forecast["yhat"].values

    metrics = evaluate_model(
        "Prophet",
        prophet_test["y"].values,
        predictions,
    )

    joblib.dump(
        model,
        MODEL_DIR / "prophet_sales_forecaster.joblib",
    )

    return predictions, metrics


# ============================================================
# MAIN PIPELINE
# ============================================================

def main():

    print("=" * 70)
    print("NovaSales - Forecasting Model Training")
    print("=" * 70)

    # --------------------------------------------------------
    # Load data
    # --------------------------------------------------------

    print("\n[1/6] Loading daily sales data...")

    df = pd.read_csv(DATA_PATH)

    df["date"] = pd.to_datetime(df["date"])

    df = df.sort_values("date").reset_index(drop=True)

    print(f"Total rows: {len(df):,}")
    print(
        f"Date range: "
        f"{df['date'].min().date()} → "
        f"{df['date'].max().date()}"
    )

    # --------------------------------------------------------
    # Feature engineering
    # --------------------------------------------------------

    print("\n[2/6] Creating forecasting features...")

    data = create_features(df)

    print(f"Feature rows: {len(data):,}")

    # --------------------------------------------------------
    # Time-based split
    # --------------------------------------------------------

    print("\n[3/6] Creating chronological train/test split...")

    train_df = data.iloc[:-TEST_DAYS].copy()
    test_df = data.iloc[-TEST_DAYS:].copy()

    print(f"Training rows: {len(train_df):,}")
    print(f"Testing rows : {len(test_df):,}")

    print(
        f"Train period: "
        f"{train_df['date'].min().date()} → "
        f"{train_df['date'].max().date()}"
    )

    print(
        f"Test period : "
        f"{test_df['date'].min().date()} → "
        f"{test_df['date'].max().date()}"
    )

    # --------------------------------------------------------
    # XGBoost
    # --------------------------------------------------------

    print("\n[4/6] XGBoost forecasting...")

    xgb_predictions, xgb_metrics = train_xgboost(
        train_df,
        test_df,
    )

    # --------------------------------------------------------
    # Prophet
    # --------------------------------------------------------

    print("\n[5/6] Prophet forecasting...")

    prophet_predictions, prophet_metrics = train_prophet(
        train_df,
        test_df,
    )

    # --------------------------------------------------------
    # Hybrid
    # --------------------------------------------------------

    print("\n[6/6] Creating hybrid ensemble...")

    # Equal-weight ensemble
    hybrid_predictions = (
        0.5 * xgb_predictions
        + 0.5 * prophet_predictions
    )

    hybrid_metrics = evaluate_model(
        "Hybrid",
        test_df["daily_sales_inr"],
        hybrid_predictions,
    )

    # --------------------------------------------------------
    # Results
    # --------------------------------------------------------

    results = pd.DataFrame(
        [
            xgb_metrics,
            prophet_metrics,
            hybrid_metrics,
        ]
    )

    results = results.sort_values(
        "RMSE"
    ).reset_index(drop=True)

    print("\n")
    print("=" * 70)
    print("MODEL COMPARISON")
    print("=" * 70)

    print(
        results.to_string(
            index=False,
            float_format=lambda x: f"{x:,.2f}",
        )
    )

    # --------------------------------------------------------
    # Save predictions
    # --------------------------------------------------------

    prediction_output = test_df[
        ["date", "daily_sales_inr"]
    ].copy()

    prediction_output["xgboost_prediction"] = xgb_predictions
    prediction_output["prophet_prediction"] = prophet_predictions
    prediction_output["hybrid_prediction"] = hybrid_predictions

    prediction_path = (
        RESULT_DIR / "forecast_predictions.csv"
    )

    prediction_output.to_csv(
        prediction_path,
        index=False,
    )

    # --------------------------------------------------------
    # Select model based on test RMSE
    # --------------------------------------------------------

    best_model = results.iloc[0]["model"]

    metadata = {
        "best_model": best_model,
        "test_days": TEST_DAYS,
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_start": str(train_df["date"].min().date()),
        "train_end": str(train_df["date"].max().date()),
        "test_start": str(test_df["date"].min().date()),
        "test_end": str(test_df["date"].max().date()),
        "metrics": results.to_dict(orient="records"),
    }

    with open(
        MODEL_DIR / "model_metadata.json",
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            metadata,
            f,
            indent=4,
        )

    print("\n" + "=" * 70)
    print("FORECASTING PIPELINE COMPLETED")
    print("=" * 70)

    print(f"Best model by RMSE: {best_model}")

    print(
        f"Predictions saved: "
        f"{prediction_path}"
    )

    print(
        f"Model metadata saved: "
        f"{MODEL_DIR / 'model_metadata.json'}"
    )


if __name__ == "__main__":
    main()