
from pathlib import Path
import json


# ============================================================
# NovaSales - Grafana Dashboard Generator
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "grafana" / "dashboards"
OUTPUT_FILE = OUTPUT_DIR / "novasales_executive.json"

DATASOURCE_UID = "dfzfaa98n6zggd"
DATASOURCE_TYPE = "yesoreyeram-infinity-datasource"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# Helpers
# ============================================================

def datasource():
    return {
        "type": DATASOURCE_TYPE,
        "uid": DATASOURCE_UID,
    }


def column(selector, title=None, data_type="number"):
    return {
        "selector": selector,
        "text": title or selector,
        "type": data_type,
    }


def infinity_target(
    url,
    columns=None,
    fmt="table",
    root_selector="",
):
    return {
        "refId": "A",
        "datasource": datasource(),
        "type": "json",
        "source": "url",
        "url": url,
        "url_options": {
            "method": "GET",
            "data": "",
            "params": [],
        },
        "parser": "backend",
        "root_selector": root_selector,
        "format": fmt,
        "columns": columns or [],
        "filters": [],
        "global_query_id": "",
    }


def base_field_config(unit=None):
    defaults = {
        "color": {
            "mode": "palette-classic"
        },
        "mappings": [],
        "thresholds": {
            "mode": "absolute",
            "steps": [
                {
                    "color": "green",
                    "value": None,
                }
            ],
        },
    }

    if unit:
        defaults["unit"] = unit

    return {
        "defaults": defaults,
        "overrides": [],
    }


def stat_panel(
    panel_id,
    title,
    description,
    x,
    y,
    w,
    h,
    url,
    selector,
    unit=None,
):
    return {
        "id": panel_id,
        "type": "stat",
        "title": title,
        "description": description,
        "gridPos": {
            "x": x,
            "y": y,
            "w": w,
            "h": h,
        },
        "datasource": datasource(),
        "fieldConfig": base_field_config(unit),
        "targets": [
            infinity_target(
                url=url,
                root_selector="[$]",
                fmt="table",
                columns=[
                    column(
                        selector,
                        selector,
                        "number",
                    )
                ],
            )
        ],
        "options": {
            "reduceOptions": {
                "calcs": [
                    "lastNotNull"
                ],
                "fields": "",
                "values": False,
            },
            "orientation": "auto",
            "textMode": "auto",
            "colorMode": "value",
            "justifyMode": "auto",
            "graphMode": "area",
        },
    }


def table_panel(
    panel_id,
    title,
    x,
    y,
    w,
    h,
    url,
    columns,
):
    return {
        "id": panel_id,
        "type": "table",
        "title": title,
        "gridPos": {
            "x": x,
            "y": y,
            "w": w,
            "h": h,
        },
        "datasource": datasource(),
        "fieldConfig": base_field_config(),
        "targets": [
            infinity_target(
                url=url,
                root_selector="$.records",
                fmt="table",
                columns=columns,
            )
        ],
        "options": {
            "cellHeight": "sm",
            "footer": {
                "show": False,
            },
            "showHeader": True,
            "sort": {
                "col": 0,
                "desc": True,
            },
        },
    }


def timeseries_panel(
    panel_id,
    title,
    x,
    y,
    w,
    h,
    url,
    time_selector,
    value_selector,
    value_title,
):
    return {
        "id": panel_id,
        "type": "timeseries",
        "title": title,
        "gridPos": {
            "x": x,
            "y": y,
            "w": w,
            "h": h,
        },
        "datasource": datasource(),
        "fieldConfig": {
            "defaults": {
                "color": {
                    "mode": "palette-classic",
                },
                "custom": {
                    "drawStyle": "line",
                    "lineInterpolation": "smooth",
                    "barAlignment": 0,
                    "lineWidth": 2,
                    "fillOpacity": 12,
                    "gradientMode": "opacity",
                    "spanNulls": True,
                    "showPoints": "auto",
                    "pointSize": 4,
                },
                "mappings": [],
                "unit": "currencyINR",
            },
            "overrides": [],
        },
        "targets": [
            infinity_target(
                url=url,
                root_selector="$.records",
                fmt="timeseries",
                columns=[
                    column(
                        time_selector,
                        "Date",
                        "time",
                    ),
                    column(
                        value_selector,
                        value_title,
                        "number",
                    ),
                ],
            )
        ],
        "options": {
            "tooltip": {
                "mode": "multi",
                "sort": "none",
            },
            "legend": {
                "showLegend": True,
                "displayMode": "list",
                "placement": "bottom",
            },
        },
    }


def markdown_panel(
    panel_id,
    title,
    content,
    x,
    y,
    w,
    h,
):
    return {
        "id": panel_id,
        "type": "text",
        "title": title,
        "gridPos": {
            "x": x,
            "y": y,
            "w": w,
            "h": h,
        },
        "options": {
            "mode": "markdown",
            "content": content,
        },
    }


# ============================================================
# Dashboard Definition
# ============================================================

dashboard = {
    "id": None,
    "uid": "novasales-executive",
    "title": "NovaSales Executive Intelligence",
    "tags": [
        "NovaSales",
        "Sales Intelligence",
        "Forecasting",
        "PySpark",
        "AI",
    ],
    "timezone": "browser",
    "schemaVersion": 39,
    "version": 4,
    "refresh": "30s",
    "time": {
        "from": "now-30d",
        "to": "now",
    },
    "templating": {
        "list": []
    },
    "annotations": {
        "list": []
    },
    "panels": [],
}


panels = []


# ============================================================
# KPI ROW 1
# ============================================================

panels.append(
    stat_panel(
        1,
        "Total Sales",
        "Total sales across all regions",
        0,
        0,
        6,
        5,
        "/sales/summary",
        "total_sales_inr",
        "currencyINR",
    )
)

panels.append(
    stat_panel(
        2,
        "Transactions",
        "Total processed transactions",
        6,
        0,
        6,
        5,
        "/sales/summary",
        "total_transactions",
        "short",
    )
)

panels.append(
    stat_panel(
        3,
        "Quantity Sold",
        "Total quantity sold",
        12,
        0,
        6,
        5,
        "/sales/summary",
        "total_quantity",
        "short",
    )
)

panels.append(
    stat_panel(
        4,
        "Active Products",
        "Currently active products",
        18,
        0,
        6,
        5,
        "/sales/summary",
        "active_products",
        "short",
    )
)


# ============================================================
# KPI ROW 2
# ============================================================

panels.append(
    stat_panel(
        5,
        "Sales Growth",
        "Latest daily sales growth versus previous day",
        0,
        5,
        6,
        5,
        "/sales/summary",
        "sales_growth_percent",
        "percent",
    )
)

panels.append(
    stat_panel(
        6,
        "Latest Daily Sales",
        "Sales recorded on the latest available date",
        6,
        5,
        6,
        5,
        "/sales/summary",
        "latest_sales_inr",
        "currencyINR",
    )
)

panels.append(
    stat_panel(
        7,
        "Average Daily Sales",
        "Average daily sales",
        12,
        5,
        6,
        5,
        "/sales/summary",
        "average_daily_sales_inr",
        "currencyINR",
    )
)

panels.append(
    stat_panel(
        8,
        "Active Regions",
        "Number of active sales regions",
        18,
        5,
        6,
        5,
        "/sales/summary",
        "active_regions",
        "short",
    )
)


# ============================================================
# SECTION
# ============================================================

panels.append(
    markdown_panel(
        9,
        "",
        """
# NOVASALES INTELLIGENCE

### Real-Time Sales Monitoring • Forecasting • Regional Intelligence

**Data:** Historical + Streaming  
**Forecast:** XGBoost  
**AI:** Cohere Explainability  
**Processing:** PySpark Structured Streaming
""",
        0,
        10,
        24,
        4,
    )
)


# ============================================================
# ACTUAL SALES TREND
# ============================================================

panels.append(
    timeseries_panel(
        10,
        "Actual Sales Trend",
        0,
        14,
        14,
        9,
        "/sales/history?limit=912",
        "date",
        "daily_sales_inr",
        "Actual Sales",
    )
)


# ============================================================
# 7-DAY FORECAST
# ============================================================

panels.append(
    timeseries_panel(
        11,
        "7-Day Sales Forecast",
        14,
        14,
        10,
        9,
        "/forecast/future?limit=7",
        "date",
        "forecast_sales_inr",
        "Forecast",
    )
)


# ============================================================
# SALES BY REGION
# ============================================================

panels.append(
    table_panel(
        12,
        "Sales by Region",
        0,
        23,
        12,
        8,
        "/sales/regions",
        [
            column(
                "region",
                "Region",
                "string",
            ),
            column(
                "sales_inr",
                "Sales (INR)",
                "number",
            ),
            column(
                "quantity",
                "Quantity",
                "number",
            ),
            column(
                "transactions",
                "Transactions",
                "number",
            ),
        ],
    )
)


# ============================================================
# TOP PRODUCTS
# ============================================================

panels.append(
    table_panel(
        13,
        "Top-Selling Products",
        12,
        23,
        12,
        8,
        "/sales/products/top?limit=10",
        [
            column(
                "product_id",
                "Product ID",
                "string",
            ),
            column(
                "product_name",
                "Product",
                "string",
            ),
            column(
                "category",
                "Category",
                "string",
            ),
            column(
                "sales_inr",
                "Sales (INR)",
                "number",
            ),
            column(
                "quantity",
                "Quantity",
                "number",
            ),
            column(
                "transactions",
                "Transactions",
                "number",
            ),
        ],
    )
)


# ============================================================
# MODEL PERFORMANCE
# ============================================================

panels.append(
    table_panel(
        14,
        "Forecast Model Performance",
        0,
        31,
        12,
        7,
        "/metrics",
        [
            column(
                "model",
                "Model",
                "string",
            ),
            column(
                "mae",
                "MAE",
                "number",
            ),
            column(
                "rmse",
                "RMSE",
                "number",
            ),
            column(
                "mape",
                "MAPE",
                "number",
            ),
        ],
    )
)


# ============================================================
# LATEST FORECAST
# ============================================================

panels.append(
    table_panel(
        15,
        "Latest Forecast",
        12,
        31,
        12,
        7,
        "/forecast/latest",
        [
            column(
                "date",
                "Date",
                "time",
            ),
            column(
                "forecast_sales_inr",
                "Forecast Sales (INR)",
                "number",
            ),
        ],
    )
)


# ============================================================
# SYSTEM INFO
# ============================================================

panels.append(
    markdown_panel(
        16,
        "NovaSales System",
        """
## NovaSales Platform

**Architecture**

`Sales Sources → PySpark → Feature Engineering → XGBoost Forecast → FastAPI → Grafana`

**Core Components**

- PySpark Structured Streaming
- Historical sales analytics
- Currency normalization to INR
- Rolling-window feature engineering
- XGBoost forecasting
- Cohere-powered explanations
- FastAPI backend
- Grafana monitoring
- Gradio sales manager interface

**Dashboard Refresh:** 30 seconds
""",
        0,
        38,
        24,
        8,
    )
)


dashboard["panels"] = panels


# ============================================================
# Write JSON
# ============================================================

with OUTPUT_FILE.open(
    "w",
    encoding="utf-8",
) as file:
    json.dump(
        dashboard,
        file,
        indent=2,
        ensure_ascii=False,
    )


print("=" * 70)
print("NovaSales Grafana Dashboard Generated")
print("=" * 70)
print(f"Output          : {OUTPUT_FILE}")
print(f"Panels          : {len(panels)}")
print(f"Dashboard UID   : {dashboard['uid']}")
print(f"Datasource UID  : {DATASOURCE_UID}")
print(f"Dashboard Ver.  : {dashboard['version']}")
print("=" * 70)