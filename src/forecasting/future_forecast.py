from pathlib import Path

import joblib
import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "daily_sales.csv"
)

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "xgboost_sales_forecaster.joblib"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "future_forecast.csv"
)


# ============================================================
# CONFIG
# ============================================================

FORECAST_DAYS = 7


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def build_features(df):

    data = df.copy()

    data["date"] = pd.to_datetime(data["date"])

    data = data.sort_values("date").reset_index(drop=True)

    data["day_of_week"] = data["date"].dt.dayofweek
    data["day_of_month"] = data["date"].dt.day
    data["week_of_year"] = (
        data["date"].dt.isocalendar().week.astype(int)
    )
    data["month"] = data["date"].dt.month
    data["quarter"] = data["date"].dt.quarter
    data["year"] = data["date"].dt.year

    data["lag_1"] = data["daily_sales_inr"].shift(1)
    data["lag_7"] = data["daily_sales_inr"].shift(7)
    data["lag_14"] = data["daily_sales_inr"].shift(14)
    data["lag_28"] = data["daily_sales_inr"].shift(28)

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

    data["sales_growth_7d"] = (
        data["daily_sales_inr"].shift(1)
        / data["daily_sales_inr"].shift(8)
        - 1
    ) * 100

    return data


# ============================================================
# FUTURE FORECAST
# ============================================================

def generate_future_forecast(
    forecast_days=FORECAST_DAYS,
):

    print("=" * 70)
    print("NovaSales - Future Sales Forecast")
    print("=" * 70)

    # --------------------------------------------------------
    # Load historical data
    # --------------------------------------------------------

    df = pd.read_csv(DATA_PATH)

    df["date"] = pd.to_datetime(df["date"])

    df = df.sort_values("date").reset_index(drop=True)

    print(
        f"\nHistorical rows: {len(df):,}"
    )

    print(
        f"Last historical date: "
        f"{df['date'].max().date()}"
    )

    # --------------------------------------------------------
    # Load model
    # --------------------------------------------------------

    bundle = joblib.load(MODEL_PATH)

    model = bundle["model"]
    feature_columns = bundle["features"]

    print("Model loaded: XGBoost")

    # --------------------------------------------------------
    # Recursive forecasting
    # --------------------------------------------------------

    working = df.copy()

    forecasts = []

    for step in range(1, forecast_days + 1):

        feature_data = build_features(working)

        latest = feature_data.iloc[-1].copy()

        next_date = (
            working["date"].max()
            + pd.Timedelta(days=1)
        )

        # ----------------------------------------------------
        # Construct future row
        # ----------------------------------------------------

        future_row = {
            "date": next_date,

            # Use recent operational averages
            "daily_quantity": (
                working["daily_quantity"]
                .tail(7)
                .mean()
            ),

            "daily_transactions": (
                working["daily_transactions"]
                .tail(7)
                .mean()
            ),

            "active_products": (
                working["active_products"]
                .tail(7)
                .mean()
            ),

            "active_regions": (
                working["active_regions"]
                .tail(7)
                .mean()
            ),

            "daily_sales_inr": np.nan,
        }

        # ----------------------------------------------------
        # Add future row temporarily
        # ----------------------------------------------------

        temp = pd.concat(
            [
                working,
                pd.DataFrame([future_row]),
            ],
            ignore_index=True,
        )

        temp_features = build_features(temp)

        latest_features = (
            temp_features.iloc[-1]
        )

        X_future = pd.DataFrame(
            [
                [
                    latest_features[col]
                    for col in feature_columns
                ]
            ],
            columns=feature_columns,
        )

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = float(
            model.predict(X_future)[0]
        )

        prediction = max(
            prediction,
            0.0,
        )

        # ----------------------------------------------------
        # Save forecast into working series
        # ----------------------------------------------------

        future_row["daily_sales_inr"] = prediction

        working = pd.concat(
            [
                working,
                pd.DataFrame([future_row]),
            ],
            ignore_index=True,
        )

        forecasts.append(
            {
                "date": next_date.strftime(
                    "%Y-%m-%d"
                ),
                "forecast_sales_inr": round(
                    prediction,
                    2,
                ),
                "forecast_day": step,
            }
        )

        print(
            f"Day {step}: "
            f"{next_date.date()} → "
            f"₹{prediction:,.2f}"
        )

    # --------------------------------------------------------
    # Save results
    # --------------------------------------------------------

    result = pd.DataFrame(forecasts)

    result.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print("\n" + "=" * 70)
    print("FUTURE FORECAST COMPLETED")
    print("=" * 70)

    print(
        f"Forecast horizon: "
        f"{forecast_days} days"
    )

    print(
        f"Output: {OUTPUT_PATH}"
    )

    print("\nForecast Preview:")
    print(result.to_string(index=False))

    return result


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    generate_future_forecast()