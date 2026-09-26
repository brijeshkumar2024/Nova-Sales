from pathlib import Path
from datetime import timedelta
import json

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_PATH = BASE_DIR / "data" / "processed" / "daily_sales.csv"
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "historical_sales.csv"
PREDICTIONS_PATH = (
    BASE_DIR / "data" / "processed" / "forecast_predictions.csv"
)
FUTURE_FORECAST_PATH = (
    BASE_DIR / "data" / "processed" / "future_forecast.csv"
)
METADATA_PATH = BASE_DIR / "models" / "model_metadata.json"
MODEL_PATH = (
    BASE_DIR / "models" / "xgboost_sales_forecaster.joblib"
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="NovaSales API",
    description=(
        "Real-Time Sales Intelligence and Forecasting Platform"
    ),
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD DATA
# ============================================================

try:
    sales_df = pd.read_csv(DATA_PATH)

    sales_df["date"] = pd.to_datetime(
        sales_df["date"]
    )

except Exception as exc:
    raise RuntimeError(
        f"Failed to load daily sales data: {exc}"
    )


try:
    prediction_df = pd.read_csv(
        PREDICTIONS_PATH
    )

    prediction_df["date"] = pd.to_datetime(
        prediction_df["date"]
    )

except Exception as exc:
    raise RuntimeError(
        f"Failed to load forecast predictions: {exc}"
    )


try:
    future_forecast_df = pd.read_csv(
        FUTURE_FORECAST_PATH
    )

    future_forecast_df["date"] = pd.to_datetime(
        future_forecast_df["date"]
    )

except Exception as exc:
    raise RuntimeError(
        f"Failed to load future forecast: {exc}"
    )


try:
    with open(
        METADATA_PATH,
        "r",
        encoding="utf-8"
    ) as file:
        metadata = json.load(file)

except Exception as exc:
    raise RuntimeError(
        f"Failed to load model metadata: {exc}"
    )


try:
    model_bundle = joblib.load(
        MODEL_PATH
    )

except Exception as exc:
    raise RuntimeError(
        f"Failed to load XGBoost model: {exc}"
    )


# ============================================================
# LOAD RAW TRANSACTION DATA
# ============================================================

try:
    raw_df = pd.read_csv(
        RAW_DATA_PATH,
        keep_default_na=False
    )

    raw_df["date"] = pd.to_datetime(
        raw_df["date"]
    )

except Exception as exc:
    raise RuntimeError(
        f"Failed to load raw sales data: {exc}"
    )


# ============================================================
# NORMALIZE COLUMN NAMES
# ============================================================

if "sales_amount_inr" in raw_df.columns:
    raw_df["sales_amount_inr"] = pd.to_numeric(
        raw_df["sales_amount_inr"],
        errors="coerce"
    )


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_active_products_for_date(target_date):
    """
    Return the number of unique products that had sales
    on the requested date.
    """

    if "product_id" not in raw_df.columns:
        return 0

    mask = raw_df["date"] == pd.Timestamp(
        target_date
    )

    return int(
        raw_df.loc[
            mask,
            "product_id"
        ].nunique()
    )


def get_active_regions_for_date(target_date):
    """
    Return the number of unique regions that had sales
    on the requested date.
    """

    if "region" not in raw_df.columns:
        return 0

    mask = raw_df["date"] == pd.Timestamp(
        target_date
    )

    return int(
        raw_df.loc[
            mask,
            "region"
        ].nunique()
    )


def safe_float(value):
    """
    Convert numeric values safely to float.
    """

    try:
        return float(value)
    except Exception:
        return 0.0


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "name": "NovaSales",
        "description": (
            "Real-Time Sales Intelligence "
            "and Forecasting Platform"
        ),
        "version": "1.0.0",
        "status": "running",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "NovaSales API",
        "model": metadata.get(
            "best_model",
            "XGBoost"
        ),
        "data_rows": len(sales_df),
    }


# ============================================================
# SALES SUMMARY
# ============================================================

@app.get("/sales/summary")
def sales_summary():

    if sales_df.empty:
        raise HTTPException(
            status_code=404,
            detail="Sales dataset is empty."
        )

    latest_row = sales_df.sort_values(
        "date"
    ).iloc[-1]

    latest_date = pd.Timestamp(
        latest_row["date"]
    )

    previous_date = latest_date - timedelta(
        days=1
    )

    latest_sales = safe_float(
        latest_row["daily_sales_inr"]
    )

    previous_rows = sales_df[
        sales_df["date"] == previous_date
    ]

    if previous_rows.empty:
        previous_sales = 0.0
    else:
        previous_sales = safe_float(
            previous_rows.iloc[0][
                "daily_sales_inr"
            ]
        )

    if previous_sales != 0:
        growth_percent = (
            (
                latest_sales
                - previous_sales
            )
            / previous_sales
        ) * 100
    else:
        growth_percent = 0.0

    total_sales = safe_float(
        sales_df["daily_sales_inr"].sum()
    )

    average_daily_sales = safe_float(
        sales_df["daily_sales_inr"].mean()
    )

    total_transactions = int(
        sales_df["daily_transactions"].sum()
    )

    total_quantity = int(
        sales_df["daily_quantity"].sum()
    )

    # --------------------------------------------------------
    # ACTIVE PRODUCTS
    # --------------------------------------------------------

    active_products = get_active_products_for_date(
        latest_date
    )

    # --------------------------------------------------------
    # ACTIVE REGIONS
    # --------------------------------------------------------

    active_regions = get_active_regions_for_date(
        latest_date
    )

    return {
        "total_sales_inr": round(
            total_sales,
            2
        ),
        "average_daily_sales_inr": round(
            average_daily_sales,
            2
        ),
        "total_transactions": total_transactions,
        "total_quantity": total_quantity,
        "active_products": active_products,
        "active_regions": active_regions,
        "latest_date": latest_date.strftime(
            "%Y-%m-%d"
        ),
        "latest_sales_inr": round(
            latest_sales,
            2
        ),
        "previous_day_sales_inr": round(
            previous_sales,
            2
        ),
        "sales_growth_percent": round(
            growth_percent,
            2
        ),
    }


# ============================================================
# SALES HISTORY
# ============================================================

@app.get("/sales/history")
def sales_history(limit: int = 912):

    limit = max(
        1,
        min(limit, len(sales_df))
    )

    df = sales_df.sort_values(
        "date"
    ).tail(limit)

    records = []

    for _, row in df.iterrows():

        records.append(
            {
                "date": row[
                    "date"
                ].strftime("%Y-%m-%d"),

                "daily_sales_inr": round(
                    safe_float(
                        row[
                            "daily_sales_inr"
                        ]
                    ),
                    2
                ),

                "daily_quantity": int(
                    row[
                        "daily_quantity"
                    ]
                ),

                "daily_transactions": int(
                    row[
                        "daily_transactions"
                    ]
                ),

                "active_products": int(
                    row[
                        "active_products"
                    ]
                )
                if "active_products" in row
                else 0,

                "active_regions": int(
                    row[
                        "active_regions"
                    ]
                )
                if "active_regions" in row
                else 0,
            }
        )

    return {
        "count": len(records),
        "records": records,
    }


# ============================================================
# HISTORICAL MODEL FORECAST
# ============================================================

@app.get("/forecast")
def forecast(limit: int = 30):

    limit = max(
        1,
        min(limit, len(prediction_df))
    )

    df = prediction_df.sort_values(
        "date"
    ).tail(limit)

    records = []

    for _, row in df.iterrows():

        record = {
            "date": row[
                "date"
            ].strftime("%Y-%m-%d"),
        }

        if "actual_sales" in row:
            record["actual_sales"] = safe_float(
                row["actual_sales"]
            )

        if "xgboost_prediction" in row:
            record["xgboost_prediction"] = safe_float(
                row["xgboost_prediction"]
            )

        if "prophet_prediction" in row:
            record["prophet_prediction"] = safe_float(
                row["prophet_prediction"]
            )

        if "hybrid_prediction" in row:
            record["hybrid_prediction"] = safe_float(
                row["hybrid_prediction"]
            )

        records.append(record)

    return {
        "count": len(records),
        "records": records,
    }


# ============================================================
# FUTURE FORECAST
# ============================================================

@app.get("/forecast/future")
def future_forecast(limit: int = 7):

    limit = max(
        1,
        min(
            limit,
            len(future_forecast_df)
        )
    )

    df = future_forecast_df.sort_values(
        "date"
    ).head(limit)

    records = []

    for index, (_, row) in enumerate(
        df.iterrows(),
        start=1
    ):

        records.append(
            {
                "date": row[
                    "date"
                ].strftime("%Y-%m-%d"),

                "forecast_day": int(
                    row.get(
                        "forecast_day",
                        index
                    )
                ),

                "forecast_sales_inr": round(
                    safe_float(
                        row[
                            "forecast_sales_inr"
                        ]
                    ),
                    2
                ),
            }
        )

    return {
        "model": metadata.get(
            "best_model",
            "XGBoost"
        ),
        "type": "future_forecast",
        "forecast_horizon_days": len(
            records
        ),
        "records": records,
    }


# ============================================================
# LATEST FORECAST
# ============================================================

@app.get("/forecast/latest")
def latest_forecast():

    if future_forecast_df.empty:
        raise HTTPException(
            status_code=404,
            detail="Future forecast is empty."
        )

    row = future_forecast_df.sort_values(
        "date"
    ).iloc[0]

    return {
        "model": metadata.get(
            "best_model",
            "XGBoost"
        ),
        "date": row[
            "date"
        ].strftime("%Y-%m-%d"),
        "forecast_sales_inr": round(
            safe_float(
                row[
                    "forecast_sales_inr"
                ]
            ),
            2
        ),
    }


# ============================================================
# MODEL METRICS
# ============================================================

@app.get("/metrics")
def metrics():

    return {
        "best_model": metadata.get(
            "best_model",
            "XGBoost"
        ),
        "test_days": metadata.get(
            "test_days",
            90
        ),
        "train_rows": metadata.get(
            "train_rows",
            794
        ),
        "test_rows": metadata.get(
            "test_rows",
            90
        ),
        "train_start": metadata.get(
            "train_start"
        ),
        "train_end": metadata.get(
            "train_end"
        ),
        "test_start": metadata.get(
            "test_start"
        ),
        "test_end": metadata.get(
            "test_end"
        ),
        "metrics": metadata.get(
            "metrics",
            []
        ),
    }


# ============================================================
# REGIONAL SALES
# ============================================================

@app.get("/sales/regions")
def regional_sales():

    if "region" not in raw_df.columns:
        return {
            "count": 0,
            "records": [],
        }

    grouped = (
        raw_df
        .groupby("region", as_index=False)
        .agg(
            sales_inr=(
                "sales_amount_inr",
                "sum"
            ),
            quantity=(
                "quantity",
                "sum"
            ),
            transactions=(
                "transaction_id",
                "count"
            ),
        )
        .sort_values(
            "sales_inr",
            ascending=False
        )
    )

    records = []

    for _, row in grouped.iterrows():

        records.append(
            {
                "region": row["region"],
                "sales_inr": round(
                    safe_float(
                        row["sales_inr"]
                    ),
                    2
                ),
                "quantity": int(
                    row["quantity"]
                ),
                "transactions": int(
                    row["transactions"]
                ),
            }
        )

    return {
        "count": len(records),
        "records": records,
    }


# ============================================================
# TOP PRODUCTS
# ============================================================

@app.get("/sales/products/top")
def top_products(limit: int = 10):

    if "product_id" not in raw_df.columns:
        return {
            "count": 0,
            "records": [],
        }

    limit = max(
        1,
        min(limit, 50)
    )

    grouped = (
        raw_df
        .groupby(
            [
                "product_id",
                "product_name",
                "category"
            ],
            as_index=False
        )
        .agg(
            sales_inr=(
                "sales_amount_inr",
                "sum"
            ),
            quantity=(
                "quantity",
                "sum"
            ),
            transactions=(
                "transaction_id",
                "count"
            ),
        )
        .sort_values(
            "sales_inr",
            ascending=False
        )
        .head(limit)
    )

    records = []

    for rank, (_, row) in enumerate(
        grouped.iterrows(),
        start=1
    ):

        records.append(
            {
                "rank": rank,
                "product_id": row[
                    "product_id"
                ],
                "product_name": row[
                    "product_name"
                ],
                "category": row[
                    "category"
                ],
                "sales_inr": round(
                    safe_float(
                        row["sales_inr"]
                    ),
                    2
                ),
                "quantity": int(
                    row["quantity"]
                ),
                "transactions": int(
                    row["transactions"]
                ),
            }
        )

    return {
        "count": len(records),
        "records": records,
    }


# ============================================================
# API INFORMATION
# ============================================================

@app.get("/api/info")
def api_info():

    return {
        "name": "NovaSales API",
        "version": "1.0.0",
        "model": metadata.get(
            "best_model",
            "XGBoost"
        ),
        "endpoints": [
            "/",
            "/health",
            "/sales/summary",
            "/sales/history",
            "/forecast",
            "/forecast/future",
            "/forecast/latest",
            "/metrics",
            "/sales/regions",
            "/sales/products/top",
            "/api/info",
        ],
    }


# ============================================================
# STARTUP INFORMATION
# ============================================================

@app.on_event("startup")
def startup_event():

    print("=" * 70)
    print("NovaSales API Started")
    print("=" * 70)
    print(
        f"Daily sales rows      : {len(sales_df):,}"
    )
    print(
        f"Raw transaction rows  : {len(raw_df):,}"
    )
    print(
        f"Forecast rows         : "
        f"{len(future_forecast_df):,}"
    )
    print(
        f"Best model            : "
        f"{metadata.get('best_model', 'XGBoost')}"
    )

    latest_date = sales_df[
        "date"
    ].max()

    print(
        f"Latest date           : "
        f"{latest_date.strftime('%Y-%m-%d')}"
    )

    print(
        f"Active products       : "
        f"{get_active_products_for_date(latest_date)}"
    )

    print(
        f"Active regions        : "
        f"{get_active_regions_for_date(latest_date)}"
    )

    print("=" * 70)