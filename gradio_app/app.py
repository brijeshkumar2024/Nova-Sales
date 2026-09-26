import os
import requests
import pandas as pd
import gradio as gr
import plotly.graph_objects as go

from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

API_BASE_URL = os.getenv(
    "NOVASALES_API_URL",
    "http://127.0.0.1:8000"
)

COHERE_API_KEY = os.getenv(
    "COHERE_API_KEY",
    ""
)


# ============================================================
# API HELPER
# ============================================================

def api_get(endpoint, params=None):
    """Call NovaSales FastAPI backend."""

    try:
        response = requests.get(
            f"{API_BASE_URL}{endpoint}",
            params=params,
            timeout=20
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "NovaSales API is not running. "
            "Start FastAPI on port 8000."
        )

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(
            f"API request failed: {exc}"
        )


# ============================================================
# FORMATTING
# ============================================================

def format_inr(value):
    """Format INR values."""

    if value is None:
        return "₹0"

    value = float(value)

    if abs(value) >= 1_00_00_000:
        return f"₹{value / 1_00_00_000:.2f} Cr"

    if abs(value) >= 1_00_000:
        return f"₹{value / 1_00_000:.2f} L"

    return f"₹{value:,.0f}"


def safe_int(value):
    try:
        return int(value)
    except Exception:
        return 0


def safe_float(value):
    try:
        return float(value)
    except Exception:
        return 0.0


# ============================================================
# SUMMARY
# ============================================================

def load_summary():
    return api_get("/sales/summary")


def get_summary_values(summary):

    total_sales = summary.get(
        "total_sales_inr",
        0
    )

    total_transactions = summary.get(
        "total_transactions",
        0
    )

    total_quantity = summary.get(
        "total_quantity",
        0
    )

    active_products = summary.get(
        "active_products",
        0
    )

    active_regions = summary.get(
        "active_regions",
        0
    )

    latest_date = summary.get(
        "latest_date",
        "-"
    )

    latest_sales = summary.get(
        "latest_sales_inr",
        0
    )

    growth = summary.get(
        "sales_growth_percent",
        0
    )

    return (
        safe_float(total_sales),
        safe_int(total_transactions),
        safe_int(total_quantity),
        safe_int(active_products),
        safe_int(active_regions),
        latest_date,
        safe_float(latest_sales),
        safe_float(growth)
    )


# ============================================================
# HISTORICAL DATA
# ============================================================

def load_history():

    response = api_get(
        "/sales/history",
        {
            "limit": 912
        }
    )

    return pd.DataFrame(
        response.get(
            "records",
            []
        )
    )


def create_history_chart(history_df):

    if history_df.empty:
        return go.Figure()

    if "date" not in history_df.columns:
        return go.Figure()

    if "daily_sales_inr" not in history_df.columns:
        return go.Figure()

    df = history_df.copy()

    df["date"] = pd.to_datetime(
        df["date"]
    )

    df["daily_sales_inr"] = pd.to_numeric(
        df["daily_sales_inr"],
        errors="coerce"
    )

    df = df.dropna(
        subset=[
            "date",
            "daily_sales_inr"
        ]
    )

    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["date"],
            y=df["daily_sales_inr"],
            mode="lines",
            name="Actual Sales",
            line=dict(
                width=2
            ),
            hovertemplate=(
                "<b>%{x|%d %b %Y}</b><br>"
                "Sales: ₹%{y:,.0f}"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        title="Historical Daily Sales",
        xaxis_title="Date",
        yaxis_title="Sales (INR)",
        template="plotly_dark",
        height=430,
        margin=dict(
            l=50,
            r=30,
            t=60,
            b=50
        ),
        hovermode="x unified"
    )

    return fig


# ============================================================
# FUTURE FORECAST
# ============================================================

def load_future_forecast():

    response = api_get(
        "/forecast/future"
    )

    return pd.DataFrame(
        response.get(
            "records",
            []
        )
    )


def create_forecast_chart(
    forecast_df
):

    if forecast_df.empty:
        return go.Figure()

    df = forecast_df.copy()

    df["date"] = pd.to_datetime(
        df["date"]
    )

    df["forecast_sales_inr"] = pd.to_numeric(
        df["forecast_sales_inr"],
        errors="coerce"
    )

    df = df.dropna(
        subset=[
            "date",
            "forecast_sales_inr"
        ]
    )

    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["date"],
            y=df["forecast_sales_inr"],
            mode="lines+markers",
            name="XGBoost Forecast",
            line=dict(
                width=3
            ),
            marker=dict(
                size=8
            ),
            hovertemplate=(
                "<b>%{x|%d %b %Y}</b><br>"
                "Forecast: ₹%{y:,.0f}"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        title="Next 7 Days — Sales Forecast",
        xaxis_title="Forecast Date",
        yaxis_title="Forecast Sales (INR)",
        template="plotly_dark",
        height=430,
        margin=dict(
            l=50,
            r=30,
            t=60,
            b=50
        ),
        hovermode="x unified"
    )

    return fig


def create_forecast_table(
    forecast_df
):

    if forecast_df.empty:

        return pd.DataFrame(
            columns=[
                "Forecast Day",
                "Date",
                "Forecast Sales"
            ]
        )

    df = forecast_df.copy()

    result = pd.DataFrame()

    result["Forecast Day"] = df.get(
        "forecast_day",
        range(
            1,
            len(df) + 1
        )
    )

    result["Date"] = pd.to_datetime(
        df["date"]
    ).dt.strftime(
        "%d %b %Y"
    )

    result["Forecast Sales"] = (
        df["forecast_sales_inr"]
        .apply(format_inr)
    )

    return result


# ============================================================
# MODEL METRICS
# ============================================================

def load_metrics():

    return api_get(
        "/metrics"
    )


def create_metrics_table(
    metrics
):

    records = metrics.get(
        "metrics",
        []
    )

    rows = []

    for item in records:

        rows.append(
            {
                "Model": item.get(
                    "model",
                    "Unknown"
                ),

                "MAE": format_inr(
                    item.get(
                        "MAE",
                        0
                    )
                ),

                "RMSE": format_inr(
                    item.get(
                        "RMSE",
                        0
                    )
                ),

                "MAPE": (
                    f"{safe_float(item.get('MAPE', 0)):.2f}%"
                )
            }
        )

    return pd.DataFrame(
        rows
    )


# ============================================================
# REGIONAL SALES
# ============================================================

def load_regions():

    response = api_get(
        "/sales/regions"
    )

    return pd.DataFrame(
        response.get(
            "records",
            []
        )
    )


def create_region_chart(
    region_df
):

    if region_df.empty:
        return go.Figure()

    df = region_df.copy()

    df["sales_inr"] = pd.to_numeric(
        df["sales_inr"],
        errors="coerce"
    )

    df = df.sort_values(
        "sales_inr",
        ascending=True
    )

    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            x=df["sales_inr"],
            y=df["region"],
            orientation="h",
            name="Regional Sales",
            hovertemplate=(
                "<b>%{y}</b><br>"
                "Sales: ₹%{x:,.0f}"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        title="Sales by Region",
        xaxis_title="Sales (INR)",
        yaxis_title="Region",
        template="plotly_dark",
        height=400,
        margin=dict(
            l=70,
            r=30,
            t=60,
            b=50
        )
    )

    return fig


def create_region_table(
    region_df
):

    if region_df.empty:
        return pd.DataFrame()

    df = region_df.copy()

    df["Sales"] = (
        df["sales_inr"]
        .apply(format_inr)
    )

    df["Quantity"] = (
        df["quantity"]
        .apply(lambda x: f"{int(x):,}")
    )

    df["Transactions"] = (
        df["transactions"]
        .apply(lambda x: f"{int(x):,}")
    )

    return df[
        [
            "region",
            "Sales",
            "Quantity",
            "Transactions"
        ]
    ].rename(
        columns={
            "region": "Region"
        }
    )


# ============================================================
# TOP PRODUCTS
# ============================================================

def load_top_products():

    response = api_get(
        "/sales/products/top",
        {
            "limit": 10
        }
    )

    return pd.DataFrame(
        response.get(
            "records",
            []
        )
    )


def create_product_chart(
    product_df
):

    if product_df.empty:
        return go.Figure()

    df = product_df.copy()

    df["sales_inr"] = pd.to_numeric(
        df["sales_inr"],
        errors="coerce"
    )

    df = df.sort_values(
        "sales_inr",
        ascending=True
    )

    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            x=df["sales_inr"],
            y=df["product_name"],
            orientation="h",
            name="Product Sales",
            hovertemplate=(
                "<b>%{y}</b><br>"
                "Sales: ₹%{x:,.0f}"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        title="Top 10 Products by Sales",
        xaxis_title="Sales (INR)",
        yaxis_title="Product",
        template="plotly_dark",
        height=500,
        margin=dict(
            l=110,
            r=30,
            t=60,
            b=50
        )
    )

    return fig


def create_product_table(
    product_df
):

    if product_df.empty:
        return pd.DataFrame()

    df = product_df.copy()

    df["Sales"] = (
        df["sales_inr"]
        .apply(format_inr)
    )

    df["Quantity"] = (
        df["quantity"]
        .apply(lambda x: f"{int(x):,}")
    )

    df["Transactions"] = (
        df["transactions"]
        .apply(lambda x: f"{int(x):,}")
    )

    return df[
        [
            "rank",
            "product_id",
            "product_name",
            "category",
            "Sales",
            "Quantity",
            "Transactions"
        ]
    ].rename(
        columns={
            "rank": "Rank",
            "product_id": "Product ID",
            "product_name": "Product",
            "category": "Category"
        }
    )


# ============================================================
# COHERE AI EXPLANATION
# ============================================================

def generate_ai_explanation(
    summary,
    forecast_df,
    metrics
):
    """
    Generate a business-language explanation of the
    already-computed forecasting results.

    Cohere does NOT generate or modify the forecast.
    """

    if not COHERE_API_KEY:

        return (
            "### 🤖 AI Explanation\n\n"
            "Cohere API key is not configured yet.\n\n"
            "The ML forecasting system is working "
            "independently. Add `COHERE_API_KEY` "
            "to `.env` to activate the explanation "
            "engine."
        )

    try:

        import cohere

        (
            total_sales,
            transactions,
            quantity,
            active_products,
            active_regions,
            latest_date,
            latest_sales,
            growth
        ) = get_summary_values(
            summary
        )

        forecast_records = []

        for _, row in forecast_df.iterrows():

            forecast_records.append(
                {
                    "date": str(
                        row["date"]
                    ),
                    "forecast_sales_inr": (
                        safe_float(
                            row[
                                "forecast_sales_inr"
                            ]
                        )
                    )
                }
            )

        best_model = metrics.get(
            "best_model",
            "XGBoost"
        )

        metric_records = metrics.get(
            "metrics",
            []
        )

        # --------------------------------------------------------
        # Extract the selected model's metrics explicitly
        # --------------------------------------------------------

        selected_metrics = {}

        for item in metric_records:

            if item.get("model") == best_model:

                selected_metrics = {
                    "MAE": safe_float(
                        item.get("MAE", 0)
                    ),
                    "RMSE": safe_float(
                        item.get("RMSE", 0)
                    ),
                    "MAPE": safe_float(
                        item.get("MAPE", 0)
                    )
                }

                break

        prompt = f"""
You are the business intelligence explanation assistant
inside NovaSales.

The forecasting system has ALREADY generated the forecast.
Your task is ONLY to explain the supplied structured data
in concise, professional business language.

Do NOT generate a new prediction.
Do NOT change, recalculate, or reinterpret the supplied
forecast values.

============================================================
SALES SUMMARY
============================================================

Total historical sales: {total_sales:.2f} INR
Transactions: {transactions}
Quantity sold: {quantity}
Active products on latest date: {active_products}
Active regions on latest date: {active_regions}
Latest date: {latest_date}
Latest day sales: {latest_sales:.2f} INR
Latest day growth versus previous day: {growth:.2f}%

============================================================
FORECAST MODEL
============================================================

Selected model: {best_model}

Selected model evaluation metrics:
{selected_metrics}

All evaluated model metrics:
{metric_records}

============================================================
7-DAY FORECAST
============================================================

{forecast_records}

============================================================
INTERPRETATION RULES
============================================================

1. Treat the forecast values as model-generated estimates.

2. MAPE is an evaluation metric calculated on the test/evaluation
   observations. If you mention MAPE, describe it as the average
   absolute percentage error on the evaluated observations.

3. NEVER describe MAPE as a guaranteed margin of error,
   confidence interval, prediction interval, or statement such as
   "the forecast can vary by ±MAPE%".

4. Do not claim that any region, product, campaign, weather event,
   customer behavior, or external factor CAUSED a sales movement
   unless that causal relationship is explicitly present in the
   supplied data.

5. You may describe observable relationships, comparisons,
   increases, decreases, peaks, lows, rankings, and patterns
   directly supported by the supplied data.

6. Clearly distinguish:
   - observed historical performance
   - model evaluation results
   - future model estimates
   - suggested business actions

7. Do not invent external market information.

8. Do not claim certainty.

9. Do not make unsupported claims about why sales increased
   or decreased.

10. Business actions must be framed as reasonable monitoring,
    investigation, planning, or operational considerations,
    not guaranteed solutions.

============================================================
REQUIRED OUTPUT
============================================================

Return exactly these four sections:

## 1. Forecast Outlook

Summarize the supplied 7-day forecast, including the highest
and lowest forecasted values and their dates when supported.

## 2. Expected Trend

Describe the observable direction or variation across the
forecast horizon. Do not invent causes.

## 3. Key Observations

Give concise observations from:
- recent historical sales
- model evaluation metrics
- regional/product activity if supported by the supplied data

## 4. Business Actions

Provide practical actions such as:
- monitoring actual vs forecast
- investigating significant deviations
- reviewing regional or product performance
- planning inventory around forecast levels
- evaluating future model improvements

Do not present any action as guaranteed to improve results.

Keep the explanation concise, factual, and suitable for a
sales manager dashboard.
"""

        client = cohere.ClientV2(
            api_key=COHERE_API_KEY
        )

        response = client.chat(
            model="command-a-03-2025",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        text = ""

        if hasattr(
            response,
            "message"
        ):

            content = (
                response.message.content
            )

            if isinstance(
                content,
                list
            ):

                for item in content:

                    if hasattr(
                        item,
                        "text"
                    ):
                        text += item.text

            elif isinstance(
                content,
                str
            ):

                text = content

        if not text:
            text = str(
                response
            )

        return (
            "### 🤖 NovaSales AI Explanation\n\n"
            + text
        )

    except Exception as exc:

        return (
            "### ⚠️ AI Explanation Error\n\n"
            f"`{str(exc)}`\n\n"
            "Forecasting and analytics remain "
            "available."
        )


# ============================================================
# COMPLETE DASHBOARD REFRESH
# ============================================================

def refresh_dashboard():

    try:

        # ----------------------------------------------------
        # LOAD CORE DATA
        # ----------------------------------------------------

        summary = load_summary()

        history_df = load_history()

        forecast_df = load_future_forecast()

        metrics = load_metrics()

        region_df = load_regions()

        product_df = load_top_products()

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        (
            total_sales,
            transactions,
            quantity,
            active_products,
            active_regions,
            latest_date,
            latest_sales,
            growth
        ) = get_summary_values(
            summary
        )

        total_forecast = 0

        average_forecast = 0

        if not forecast_df.empty:

            total_forecast = (
                forecast_df[
                    "forecast_sales_inr"
                ]
                .astype(float)
                .sum()
            )

            average_forecast = (
                forecast_df[
                    "forecast_sales_inr"
                ]
                .astype(float)
                .mean()
            )

        best_model = metrics.get(
            "best_model",
            "XGBoost"
        )

        # ----------------------------------------------------
        # CHARTS
        # ----------------------------------------------------

        history_chart = (
            create_history_chart(
                history_df
            )
        )

        forecast_chart = (
            create_forecast_chart(
                forecast_df
            )
        )

        region_chart = (
            create_region_chart(
                region_df
            )
        )

        product_chart = (
            create_product_chart(
                product_df
            )
        )

        # ----------------------------------------------------
        # TABLES
        # ----------------------------------------------------

        forecast_table = (
            create_forecast_table(
                forecast_df
            )
        )

        metrics_table = (
            create_metrics_table(
                metrics
            )
        )

        region_table = (
            create_region_table(
                region_df
            )
        )

        product_table = (
            create_product_table(
                product_df
            )
        )

        # ----------------------------------------------------
        # AI
        # ----------------------------------------------------

        ai_explanation = (
            generate_ai_explanation(
                summary,
                forecast_df,
                metrics
            )
        )

        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        status = (
            f"🟢 **NovaSales API Connected**  |  "
            f"Model: **{best_model}**  |  "
            f"Latest Data: **{latest_date}**  |  "
            f"Active Regions: **{active_regions}**"
        )

        # ----------------------------------------------------
        # RETURN
        # ----------------------------------------------------

        return (
            format_inr(
                total_sales
            ),

            f"{transactions:,}",

            f"{quantity:,}",

            f"{active_products:,}",

            f"{active_regions:,}",

            format_inr(
                total_forecast
            ),

            format_inr(
                average_forecast
            ),

            f"{growth:.2f}%",

            status,

            history_chart,

            forecast_chart,

            forecast_table,

            metrics_table,

            region_chart,

            region_table,

            product_chart,

            product_table,

            ai_explanation
        )

    except Exception as exc:

        error = (
            "🔴 **Dashboard Error**\n\n"
            f"`{str(exc)}`"
        )

        return (
            "—",
            "—",
            "—",
            "—",
            "—",
            "—",
            "—",
            "—",
            error,
            go.Figure(),
            go.Figure(),
            pd.DataFrame(),
            pd.DataFrame(),
            go.Figure(),
            pd.DataFrame(),
            go.Figure(),
            pd.DataFrame(),
            error
        )


# ============================================================
# CUSTOM CSS
# ============================================================

CUSTOM_CSS = """

:root {
    --ns-bg: #080b12;
    --ns-card: #111722;
    --ns-border: #202938;
    --ns-text: #f4f7fb;
    --ns-muted: #8994a6;
}

body {
    background: var(--ns-bg) !important;
}

.gradio-container {
    max-width: 1500px !important;
    margin: auto !important;
    background: var(--ns-bg) !important;
}

.ns-header {
    padding: 24px 10px 10px 10px;
}

.ns-title {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1px;
}

.ns-subtitle {
    color: var(--ns-muted);
    font-size: 15px;
    margin-top: 5px;
}

.ns-kpi {
    background: linear-gradient(
        145deg,
        #121925,
        #0d131d
    );
    border: 1px solid var(--ns-border);
    border-radius: 16px;
    padding: 8px;
}

.ns-section {
    font-size: 21px;
    font-weight: 700;
    margin-top: 16px;
}

footer {
    display: none !important;
}

"""


# ============================================================
# GRADIO APP
# ============================================================

with gr.Blocks(
    title="NovaSales — Sales Intelligence",
    css=CUSTOM_CSS,
    theme=gr.themes.Soft(
        primary_hue="blue",
        neutral_hue="slate"
    )
) as demo:

    # --------------------------------------------------------
    # HEADER
    # --------------------------------------------------------

    gr.HTML(
        """
        <div class="ns-header">

            <div class="ns-title">
                NovaSales
            </div>

            <div class="ns-subtitle">
                Real-Time Sales Intelligence & Forecasting Platform
            </div>

            <div class="ns-subtitle">
                PySpark · XGBoost · Prophet · FastAPI · Gradio · Cohere
            </div>

        </div>
        """
    )

    status_box = gr.Markdown(
        "🟡 Connecting..."
    )

    # --------------------------------------------------------
    # KPI ROW 1
    # --------------------------------------------------------

    with gr.Row():

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 💰 Historical Sales"
            )

            total_sales_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 🧾 Transactions"
            )

            transactions_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 📦 Quantity Sold"
            )

            quantity_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 🛍️ Active Products"
            )

            products_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

    # --------------------------------------------------------
    # KPI ROW 2
    # --------------------------------------------------------

    with gr.Row():

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 🌍 Active Regions"
            )

            regions_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 🔮 7-Day Forecast"
            )

            total_forecast_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 📊 Avg. Daily Forecast"
            )

            average_forecast_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

        with gr.Column(
            elem_classes="ns-kpi"
        ):

            gr.Markdown(
                "### 📉 Latest Growth"
            )

            growth_box = gr.Textbox(
                value="—",
                show_label=False,
                interactive=False
            )

    # --------------------------------------------------------
    # REFRESH
    # --------------------------------------------------------

    refresh_button = gr.Button(
        "🔄 Refresh Dashboard",
        variant="primary"
    )

    # --------------------------------------------------------
    # HISTORICAL SALES
    # --------------------------------------------------------

    gr.Markdown(
        "## 📈 Historical Sales",
        elem_classes="ns-section"
    )

    history_plot = gr.Plot(
        show_label=False
    )

    # --------------------------------------------------------
    # FORECAST
    # --------------------------------------------------------

    gr.Markdown(
        "## 🔮 Sales Forecast",
        elem_classes="ns-section"
    )

    forecast_plot = gr.Plot(
        show_label=False
    )

    forecast_table = gr.Dataframe(
        interactive=False,
        label="7-Day Forecast"
    )

    # --------------------------------------------------------
    # MODEL PERFORMANCE
    # --------------------------------------------------------

    gr.Markdown(
        "## 🎯 Model Performance",
        elem_classes="ns-section"
    )

    metrics_table = gr.Dataframe(
        interactive=False,
        label="Forecasting Model Evaluation"
    )

    # --------------------------------------------------------
    # REGIONAL ANALYTICS
    # --------------------------------------------------------

    gr.Markdown(
        "## 🌍 Regional Sales Intelligence",
        elem_classes="ns-section"
    )

    region_plot = gr.Plot(
        show_label=False
    )

    region_table = gr.Dataframe(
        interactive=False,
        label="Regional Sales Breakdown"
    )

    # --------------------------------------------------------
    # TOP PRODUCTS
    # --------------------------------------------------------

    gr.Markdown(
        "## 🏆 Top-Selling Products",
        elem_classes="ns-section"
    )

    product_plot = gr.Plot(
        show_label=False
    )

    product_table = gr.Dataframe(
        interactive=False,
        label="Top 10 Products"
    )

    # --------------------------------------------------------
    # AI EXPLANATION
    # --------------------------------------------------------

    gr.Markdown(
        "## 🤖 AI Business Explanation",
        elem_classes="ns-section"
    )

    gr.Markdown(
        """
        The forecasting model generates the prediction.
        Cohere is used separately to explain the structured
        prediction in business language. It does not generate
        or modify the forecast.
        """
    )

    ai_explanation_box = gr.Markdown(
        "AI explanation will appear here."
    )

    # --------------------------------------------------------
    # FOOTER
    # --------------------------------------------------------

    gr.Markdown(
        """
        ---
        **NovaSales** · Real-Time Sales Intelligence Platform  
        PySpark · XGBoost · Prophet · FastAPI · Gradio · Cohere
        """
    )

    # --------------------------------------------------------
    # OUTPUT LIST
    # --------------------------------------------------------

    outputs = [

        total_sales_box,

        transactions_box,

        quantity_box,

        products_box,

        regions_box,

        total_forecast_box,

        average_forecast_box,

        growth_box,

        status_box,

        history_plot,

        forecast_plot,

        forecast_table,

        metrics_table,

        region_plot,

        region_table,

        product_plot,

        product_table,

        ai_explanation_box
    ]

    # --------------------------------------------------------
    # EVENTS
    # --------------------------------------------------------

    refresh_button.click(
        fn=refresh_dashboard,
        inputs=[],
        outputs=outputs
    )

    demo.load(
        fn=refresh_dashboard,
        inputs=[],
        outputs=outputs
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("NovaSales Gradio Dashboard")
    print("=" * 70)

    print(
        f"FastAPI URL: {API_BASE_URL}"
    )

    print(
        "Dashboard: http://127.0.0.1:7860"
    )

    print("=" * 70)

    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        show_error=True,
        inbrowser=True
    )