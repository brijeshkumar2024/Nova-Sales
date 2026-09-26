# NovaSales

<p align="center">
  <strong>Real-Time Sales Intelligence & Forecasting Platform</strong>
</p>

<p align="center">
  A production-oriented analytics platform that unifies multi-region, multi-currency sales data, processes continuous streams with PySpark, forecasts future demand with machine learning, and turns model output into explainable business intelligence.
</p>

<p align="center">
  <a href="https://github.com/brijeshkumar2024/Nova-Sales"><strong>Repository</strong></a>
  &nbsp;•&nbsp;
  <a href="https://github.com/brijeshkumar2024/Nova-Sales/tree/main/src"><strong>Backend</strong></a>
  &nbsp;•&nbsp;
  <a href="https://github.com/brijeshkumar2024/Nova-Sales/tree/main/web"><strong>Web UI</strong></a>
</p>

---

## Overview

NovaSales is an end-to-end sales intelligence system built around **PS-17 — Sales Prediction Analysis**.

The platform addresses a common enterprise analytics problem: sales data arrives from multiple regional sources, may use different currencies and structures, and must be transformed into a reliable time series before forecasting and business interpretation can happen.

NovaSales combines:

- **PySpark ETL** for sales preparation
- **PySpark Structured Streaming** for continuous sales ingestion
- **Feature engineering** for time-series forecasting
- **XGBoost + Prophet + Hybrid forecasting**
- **FastAPI** for the application API
- **Cohere** for explainable natural-language insights
- **Gradio** for the manager-facing AI interface
- **Grafana** for operational analytics
- **Next.js + TypeScript + Tailwind CSS** for the premium web experience
- **AWS S3** for cloud data storage

> **Design principle:** the forecasting model produces the forecast; Cohere explains the structured forecast context. The generative model does not generate or modify the numerical forecast.





---

## Problem

Regional sales systems create fragmented data across:

- regions and countries
- currencies
- products and categories
- marketing campaigns
- transaction volumes
- continuously arriving records

Without a unified processing layer, it becomes difficult to:

1. normalize sales values,
2. aggregate reliable daily and weekly time series,
3. engineer forecasting features,
4. evaluate forecasting models chronologically,
5. expose predictions through an operational interface, and
6. explain forecast signals to business users.

NovaSales provides that pipeline as a single system.

---

## Solution Architecture

~~~text
┌─────────────────────┐
│   Sales Sources     │
│ Regional / Currency │
└──────────┬──────────┘
           │
           ├──────────────────────┐
           │                      │
           ▼                      ▼
┌──────────────────┐    ┌────────────────────┐
│    AWS S3        │    │ Continuous Sales   │
│ Historical Data  │    │ Streaming Input    │
└────────┬─────────┘    └──────────┬─────────┘
         │                         │
         ▼                         ▼
┌────────────────────────────────────────────┐
│              PySpark Layer                 │
│ Cleaning • Currency Normalization • ETL   │
│ Deduplication • Aggregation • Streaming   │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│          Feature Engineering               │
│ Rolling Averages • Growth • Time Features │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│            Forecasting Layer               │
│ XGBoost • Prophet • Hybrid Evaluation     │
└──────────────────────┬─────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       ┌─────────────┐   ┌────────────────┐
       │  FastAPI    │   │ Cohere         │
       │  REST API   │   │ Explanation    │
       └──────┬──────┘   └───────┬────────┘
              │                  │
       ┌──────┴──────────────────┴──────┐
       │                                 │
       ▼                                 ▼
┌──────────────────┐             ┌─────────────────┐
│ Next.js Web App  │             │ Gradio Manager  │
│ Analytics UI     │             │ AI Insights     │
└──────────────────┘             └─────────────────┘
              │
              ▼
       ┌───────────────┐
       │    Grafana    │
       │ BI Dashboard  │
       └───────────────┘
~~~

### Cloud / streaming architecture

The repository is designed around AWS S3 as the cloud storage layer. PySpark Structured Streaming provides the local streaming implementation and processing path.

**AWS Kinesis is part of the target streaming architecture, but was not claimed as a deployed production resource in this implementation.** The current repository distinguishes between implemented local streaming and planned cloud-stream ingestion rather than presenting an undeployed component as live infrastructure.

---

## Core Capabilities

### 01 — Multi-Currency Sales Normalization

Sales records are standardized into INR using the supplied currency conversion field.

The processing pipeline handles:

- schema normalization
- type casting
- duplicate removal
- campaign normalization
- invalid-record filtering
- currency normalization
- daily aggregation
- weekly aggregation

### 02 — Continuous Sales Processing

PySpark Structured Streaming processes incoming sales batches through a streaming pipeline.

The implementation includes:

- file-based continuous ingestion
- checkpointing
- watermarking
- deduplication
- event-time windows
- incremental aggregation
- processed streaming outputs

### 03 — Forecasting

NovaSales evaluates multiple forecasting approaches:

| Model | MAE | RMSE | MAPE |
|---|---:|---:|---:|
| XGBoost | ₹24.52M | ₹31.92M | 21.95% |
| Hybrid | ₹24.43M | ₹32.17M | 21.26% |
| Prophet | ₹26.94M | ₹35.29M | 22.82% |

Evaluation uses a **strict chronological holdout**:

- Training: 794 rows
- Test: 90 days
- Training period: 2024-01-29 → 2026-04-01
- Evaluation period: 2026-04-02 → 2026-06-30

The current model-selection metadata selects **XGBoost by lowest RMSE**.

> MAPE is reported as an evaluation metric over the held-out observations. It is not a prediction interval and should not be interpreted as a guaranteed forecast-error range.

### 04 — Seven-Day Forecast

The forecasting service generates a seven-day forward horizon.

The API exposes the forecast through:

    GET /forecast/future?limit=7

Example forecast horizon from the current trained artifact:

| Date | Forecast Sales |
|---|---:|
| 2026-07-01 | ₹125.72M |
| 2026-07-02 | ₹124.18M |
| 2026-07-03 | ₹107.30M |
| 2026-07-04 | ₹113.66M |
| 2026-07-05 | ₹109.17M |
| 2026-07-06 | ₹119.59M |
| 2026-07-07 | ₹118.83M |

### 05 — Explainable AI Layer

Cohere is used as an **explanation layer** over structured business and forecasting context.

The system provides the model with structured information such as:

- recent sales
- sales growth
- forecast values
- regional performance
- top products
- evaluated model metrics

Cohere then produces a business-oriented explanation.

The architecture intentionally separates:

    Forecast Generation → Structured Context → Natural-Language Explanation

This prevents the generative layer from silently changing numerical predictions.

### 06 — Manager Interfaces

NovaSales provides multiple interfaces for different users.

**Next.js**

- executive overview
- sales dashboard
- forecast analysis
- regional analytics
- product analytics
- AI insights
- system architecture
- developer documentation
- privacy and terms pages

**Gradio**

- manager-oriented forecasting interface
- forecast output
- model evaluation metrics
- regional sales context
- top-product context
- Cohere-generated explanation

**Grafana**

- actual sales trend
- forecast trend
- sales by region
- top-selling products
- forecast model performance
- operational KPIs

---

## Dataset

The development dataset contains:

- **100,000 transactions**
- **912 daily observations**
- **131 weekly observations**
- **5 regions**
- **4 countries**
- **30 products**
- **6 product categories**
- **4 currencies**
- Date range: **2024-01-01 → 2026-06-30**

The raw dataset is intentionally **not committed to the public repository**. Generated datasets, processed outputs, model binaries, local credentials, and runtime artifacts are excluded through .gitignore.

---

## API

FastAPI exposes the core application services.

| Endpoint | Purpose |
|---|---|
| GET / | Service information |
| GET /health | Health check |
| GET /sales/summary | Sales KPIs and growth |
| GET /sales/history | Historical daily sales |
| GET /forecast | Historical forecast/evaluation records |
| GET /forecast/future | Forward forecast |
| GET /forecast/latest | Latest forecast |
| GET /metrics | Model evaluation metrics |
| GET /sales/regions | Regional sales breakdown |
| GET /sales/products/top | Top-selling products |
| GET /api/info | API metadata |

---

## Technology Stack

### Data & Distributed Processing

- Python 3.12
- PySpark
- Pandas
- NumPy
- PyArrow

### Machine Learning

- XGBoost
- Prophet
- Scikit-learn
- Joblib

### Backend

- FastAPI
- Pydantic
- Uvicorn

### Generative AI

- Cohere API

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Framer Motion
- Lucide React

### Visualization

- Grafana
- Gradio
- Plotly
- Charting components

### Cloud

- AWS S3
- AWS IAM
- AWS CloudWatch
- AWS Kinesis — target streaming integration

---

## Project Structure

~~~text
Nova-Sales/
│
├── gradio_app/
│   └── app.py
│
├── grafana/
│   ├── dashboards/
│   ├── provisioning/
│   └── create_dashboard.py
│
├── models/
│   └── model_metadata.json
│
├── src/
│   ├── api/
│   ├── app/
│   ├── aws/
│   ├── data_generation/
│   ├── forecasting/
│   ├── spark/
│   └── streaming/
│
├── web/
│   ├── src/app/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── screenshots/
├── .env.example
├── .gitignore
├── LICENSE
└── requirements.txt
~~~

Generated data, raw datasets, model binaries, checkpoints, credentials, and local build artifacts are excluded from version control.

---

## Local Setup

### 1. Clone

~~~bash
git clone https://github.com/brijeshkumar2024/Nova-Sales.git
cd Nova-Sales
~~~

### 2. Python environment

~~~bash
python -m venv .venv
~~~

Windows:

~~~bat
.venv\\Scripts\\activate
~~~

Install dependencies:

~~~bash
pip install -r requirements.txt
~~~

### 3. Environment variables

Copy the example environment file:

~~~bat
copy .env.example .env
~~~

Configure credentials locally:

~~~env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-north-1
AWS_S3_BUCKET=

COHERE_API_KEY=
~~~

**Never commit .env or real credentials.**

### 4. Start the FastAPI service

From the repository root:

~~~bash
uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
~~~

API:

http://127.0.0.1:8000

### 5. Start the Next.js application

~~~bash
cd web
npm install
npm run dev
~~~

The frontend runs on the first available local development port.

---

## Forecasting Workflow

~~~text
Raw Transactions
       ↓
Schema Validation
       ↓
Currency Normalization
       ↓
Deduplication
       ↓
Daily / Weekly Aggregation
       ↓
Feature Engineering
       ↓
Chronological Train/Test Split
       ↓
XGBoost / Prophet / Hybrid
       ↓
Metric Evaluation
       ↓
Model Selection
       ↓
Future Forecast
       ↓
Structured Business Context
       ↓
Cohere Explanation
~~~

This separation keeps numerical forecasting deterministic and makes the generative explanation layer auditable.

---

## Security & Data Handling

NovaSales follows a repository-safe configuration model:

- secrets are loaded through environment variables
- .env is ignored
- .env.example contains placeholders only
- raw transaction data is excluded from Git
- generated model binaries are excluded
- streaming checkpoints are excluded
- local build artifacts are excluded
- AWS S3 is configured as a private data store

For production deployment, credentials should be supplied through an appropriate secrets-management mechanism rather than committed configuration files.

---

## Engineering Notes

### Model evaluation

The forecasting evaluation is chronological rather than randomly shuffled. This avoids leaking future observations into training data.

### Streaming

The current implementation demonstrates continuous processing using PySpark Structured Streaming with file-based ingestion. This makes the streaming pipeline reproducible locally.

### Cloud boundary

S3 integration is implemented. The repository documents Kinesis as the target cloud-streaming component without representing it as a deployed production resource.

### Explainability boundary

Cohere receives structured context and produces natural-language interpretation. It is not used as the numerical forecasting engine.

---

## Current System Snapshot

| Layer | Status |
|---|---|
| Historical data generation | Implemented |
| PySpark ETL | Implemented |
| Daily / weekly aggregation | Implemented |
| Feature engineering | Implemented |
| XGBoost forecasting | Implemented |
| Prophet forecasting | Implemented |
| Hybrid forecasting | Implemented |
| Seven-day forecast | Implemented |
| FastAPI | Implemented |
| Cohere explanation layer | Implemented |
| Gradio interface | Implemented |
| Grafana dashboard | Implemented |
| Next.js interface | Implemented |
| AWS S3 integration | Implemented |
| PySpark streaming simulation | Implemented |
| AWS Kinesis production stream | Not deployed |

---

## Project Status

**NovaSales is an end-to-end engineering prototype with working local data processing, forecasting, API, AI explanation, visualization, and web layers.**

The architecture is modular so that the local streaming ingestion boundary can be replaced or extended with a managed cloud stream without changing the downstream forecasting and presentation layers.

---

## Author

**Brijesh Kumar Mohanty**

Computer Science & Information Technology  
C. V. Raman Global University, Bhubaneswar

- GitHub: https://github.com/brijeshkumar2024
- LinkedIn: https://www.linkedin.com/in/brijesh-kumar-mohanty

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full license text.

---

<p align="center">
  <strong>NovaSales</strong><br/>
  Turning fragmented sales data into forecastable, explainable intelligence.
</p>
