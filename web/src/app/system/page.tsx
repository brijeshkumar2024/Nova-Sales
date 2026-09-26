"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  GitBranch,
  HardDrive,
  Layers3,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

type Health = {
  status: string;
  service: string;
  model: string;
  data_rows: number;
};

type ApiInfo = {
  [key: string]: unknown;
};

const pipeline = [
  {
    number: "01",
    title: "Sales data",
    description:
      "Historical transactions and continuously arriving simulated sales batches.",
    icon: Database,
    status: "Active",
  },
  {
    number: "02",
    title: "PySpark ETL",
    description:
      "Cleaning, validation, currency normalization, aggregation, and feature engineering.",
    icon: Server,
    status: "Validated",
  },
  {
    number: "03",
    title: "Streaming",
    description:
      "PySpark Structured Streaming processes arriving CSV batches continuously.",
    icon: Radio,
    status: "Validated",
  },
  {
    number: "04",
    title: "Forecasting",
    description:
      "XGBoost, Prophet, and Hybrid models evaluated using chronological validation.",
    icon: Activity,
    status: "Active",
  },
  {
    number: "05",
    title: "AI explanation",
    description:
      "Cohere converts structured forecast context into natural-language explanation.",
    icon: BrainCircuit,
    status: "Active",
  },
  {
    number: "06",
    title: "Interfaces",
    description:
      "Next.js, Gradio, and Grafana expose business and technical intelligence.",
    icon: Layers3,
    status: "Active",
  },
];

const infrastructure = [
  {
    title: "AWS S3",
    description:
      "Cloud object storage for raw sales data, processed datasets, features, and streaming outputs.",
    icon: Cloud,
    status: "Connected",
  },
  {
    title: "AWS IAM",
    description:
      "Dedicated NovaSales application identity with scoped S3 bucket and object permissions.",
    icon: ShieldCheck,
    status: "Configured",
  },
  {
    title: "CloudWatch",
    description:
      "AWS resource and API usage monitoring was evaluated through CloudWatch.",
    icon: Activity,
    status: "Evaluated",
  },
  {
    title: "AWS Kinesis",
    description:
      "Intended managed ingestion layer. Not deployed because of account-level service access limitations.",
    icon: Radio,
    status: "Not deployed",
  },
];

function StatusBadge({
  status,
}: {
  status: "Active" | "Validated" | "Connected" | "Configured" | "Evaluated" | "Not deployed";
}) {
  const inactive = status === "Not deployed";

  return (
    <span
      className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.1em] ${
        inactive
          ? "text-[var(--text-muted)]"
          : "text-[var(--success)]"
      }`}
    >
      {inactive ? (
        <span className="h-1.5 w-1.5 bg-[var(--text-muted)]" />
      ) : (
        <span className="ns-status-dot" />
      )}
      {status}
    </span>
  );
}

export default function SystemPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadSystem(refresh = false) {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const [healthResponse, infoResponse] = await Promise.all([
        fetch(`${API_BASE}/health`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/info`, {
          cache: "no-store",
        }),
      ]);

      if (!healthResponse.ok || !infoResponse.ok) {
        throw new Error("System API request failed.");
      }

      const healthData = await healthResponse.json();
      const infoData = await infoResponse.json();

      setHealth(healthData);
      setApiInfo(infoData);
    } catch (err) {
      console.error(err);

      setHealth(null);
      setApiInfo(null);

      setError(
        "Unable to reach the NovaSales API. Make sure FastAPI is running on port 8000.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSystem();
  }, []);

  return (
    <main className="ns-page">
      <header className="ns-header">
        <div className="ns-container ns-header-inner">
          <a href="/" className="ns-brand">
            <span className="ns-brand-mark" />

            <span>
              <span className="ns-brand-name block">NOVASALES</span>
              <span className="ns-brand-subtitle block">
                Sales Intelligence Platform
              </span>
            </span>
          </a>

          <nav className="ns-nav">
            <a href="/dashboard" className="ns-nav-link">
              Dashboard
            </a>

            <a href="/forecast" className="ns-nav-link">
              Forecast
            </a>

            <a href="/analytics" className="ns-nav-link">
              Analytics
            </a>

            <a href="/ai-insights" className="ns-nav-link">
              AI Insights
            </a>

            <a href="/system" className="ns-nav-link">
              System
            </a>
          </nav>

          <button
            onClick={() => loadSystem(true)}
            disabled={refreshing}
            className="ns-button-secondary"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </header>

      <div className="ns-container">
        {/* HERO */}
        <section className="border-b border-[var(--line)] py-14 sm:py-18 lg:py-24">
          <a
            href="/dashboard"
            className="ns-link inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]"
          >
            <ArrowLeft size={13} />
            Back to dashboard
          </a>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
            <div>
              <div className="ns-eyebrow">System / Infrastructure</div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                Every layer of NovaSales, visible.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                A technical view of the data pipeline, forecasting engine,
                GenAI layer, API service, cloud infrastructure, and business
                interfaces powering the platform.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/developers" className="ns-button-primary">
                  Engineering overview
                  <ArrowRight size={15} />
                </a>

                <a
                  href={`${API_BASE}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="ns-button-secondary"
                >
                  API documentation
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <Terminal
                    size={15}
                    className="text-[var(--accent)]"
                  />

                  <span className="ns-panel-title">
                    Runtime status
                  </span>
                </div>

                {health?.status === "ok" ? (
                  <StatusBadge status="Active" />
                ) : (
                  <span className="text-[9px] uppercase tracking-[0.1em] text-red-400">
                    Offline
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2">
                <div className="border-b border-r border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {loading ? "—" : health?.status ?? "Offline"}
                  </div>

                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    API status
                  </div>
                </div>

                <div className="border-b border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {health?.model ?? "—"}
                  </div>

                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Active model
                  </div>
                </div>

                <div className="border-r border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {health?.data_rows?.toLocaleString("en-IN") ?? "—"}
                  </div>

                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Daily data rows
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-2xl font-medium text-white">
                    8000
                  </div>

                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    API port
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <section className="border-b border-[var(--line)] py-8">
            <div className="border border-red-500/20 bg-red-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <XCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>
                  <div className="text-sm font-medium text-white">
                    API unavailable
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {error}
                  </p>

                  <button
                    onClick={() => loadSystem(true)}
                    className="ns-link mt-4 inline-flex items-center gap-2 text-[11px]"
                  >
                    Retry
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PIPELINE */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div>
            <div className="ns-eyebrow">Data-to-decision pipeline</div>

            <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Six layers. One operational flow.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Each stage has a defined responsibility, making the platform
              easier to validate, demonstrate, and maintain.
            </p>
          </div>

          <div className="mt-10 grid border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {pipeline.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.number}
                  className="ns-architecture-node"
                >
                  <div className="flex items-center justify-between">
                    <span className="ns-node-number">
                      {item.number}
                    </span>

                    <Icon
                      size={17}
                      strokeWidth={1.4}
                      className="text-[var(--text-muted)]"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <h3 className="ns-node-title !mt-0">
                      {item.title}
                    </h3>

                    <StatusBadge
                      status={
                        item.status as
                          | "Active"
                          | "Validated"
                          | "Connected"
                          | "Configured"
                          | "Evaluated"
                          | "Not deployed"
                      }
                    />
                  </div>

                  <p className="ns-node-description">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* INFRASTRUCTURE */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Cloud infrastructure</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                AWS integration, clearly scoped.
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                NovaSales uses AWS where it materially supports storage,
                access control, and infrastructure evaluation.
              </p>
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              {infrastructure.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="grid gap-5 border-b border-[var(--line)] p-6 last:border-b-0 sm:grid-cols-[42px_1fr_auto]"
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.4}
                      className="text-[var(--accent)]"
                    />

                    <div>
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>

                      <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        item.status as
                          | "Active"
                          | "Validated"
                          | "Connected"
                          | "Configured"
                          | "Evaluated"
                          | "Not deployed"
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* API */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div>
            <div className="ns-eyebrow">Service layer</div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              FastAPI runtime.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              The backend provides a single structured service layer for the
              frontend, Gradio interface, and operational analytics.
            </p>
          </div>

          <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Health", "/health", "Runtime status"],
              ["Sales", "/sales/summary", "Executive KPIs"],
              ["Forecast", "/forecast/future", "Future prediction"],
              ["Metrics", "/metrics", "Model evaluation"],
              ["Regions", "/sales/regions", "Regional analysis"],
              ["Products", "/sales/products/top", "Product ranking"],
              ["History", "/sales/history", "Daily sales"],
              ["Info", "/api/info", "Service metadata"],
            ].map(([name, route, purpose]) => (
              <div
                key={route}
                className="bg-[var(--surface)] p-6"
              >
                <div className="ns-kpi-label">{name}</div>

                <code className="mt-4 block text-[11px] text-white">
                  GET {route}
                </code>

                <div className="mt-3 text-[10px] leading-5 text-[var(--text-muted)]">
                  {purpose}
                </div>
              </div>
            ))}
          </div>

          {apiInfo && (
            <div className="mt-5 border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 text-[var(--success)]"
                />

                <div>
                  <div className="text-sm text-white">
                    API metadata loaded successfully
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                    The backend is responding to the frontend runtime and
                    exposing its service metadata.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* STORAGE + STREAMING */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] lg:grid-cols-2">
            <div className="bg-[var(--surface)] p-7 lg:p-9">
              <HardDrive
                size={19}
                className="text-[var(--accent)]"
              />

              <div className="ns-eyebrow mt-7">Cloud storage</div>

              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                S3 data layer
              </h2>

              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                Raw historical sales were uploaded to AWS S3. Processed
                daily and regional outputs and the validated streaming
                outputs were also uploaded to the bucket.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  "raw/",
                  "processed/",
                  "features/",
                  "streaming/",
                ].map((path) => (
                  <div
                    key={path}
                    className="flex items-center gap-3 border border-[var(--line)] px-4 py-3"
                  >
                    <Database
                      size={13}
                      className="text-[var(--text-muted)]"
                    />

                    <code className="text-[11px] text-[var(--text-secondary)]">
                      s3://novasales-.../{path}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-7 lg:p-9">
              <Radio
                size={19}
                className="text-[var(--accent)]"
              />

              <div className="ns-eyebrow mt-7">Continuous processing</div>

              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                PySpark Structured Streaming
              </h2>

              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                The streaming pipeline was implemented and validated locally
                using simulated arriving sales batches, with automatic file
                discovery and incremental processing.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-px bg-[var(--line)]">
                <div className="bg-black/10 p-5">
                  <div className="text-2xl font-medium text-white">
                    20
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Input batches
                  </div>
                </div>

                <div className="bg-black/10 p-5">
                  <div className="text-2xl font-medium text-white">
                    42
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Output files
                  </div>
                </div>

                <div className="bg-black/10 p-5">
                  <div className="text-2xl font-medium text-white">
                    15s
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Trigger interval
                  </div>
                </div>

                <div className="bg-black/10 p-5">
                  <div className="text-2xl font-medium text-white">
                    S3
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Cloud output
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE NOTE */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="ns-command-panel">
            <div className="ns-panel-header">
              <div className="flex items-center gap-3">
                <GitBranch
                  size={15}
                  className="text-[var(--accent)]"
                />

                <span className="ns-panel-title">
                  Deployment note
                </span>
              </div>

              <span className="ns-mono text-[9px] text-[var(--text-muted)]">
                TRANSPARENT STATUS
              </span>
            </div>

            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
              <div>
                <div className="text-lg font-medium text-white">
                  What is deployed and validated
                </div>

                <ul className="mt-5 space-y-3">
                  {[
                    "PySpark ETL and feature engineering",
                    "PySpark Structured Streaming",
                    "Forecasting models",
                    "FastAPI backend",
                    "Gradio manager interface",
                    "Cohere explanation layer",
                    "Grafana dashboard",
                    "AWS S3 and IAM integration",
                    "Premium Next.js frontend",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-xs text-[var(--text-secondary)]"
                    >
                      <CheckCircle2
                        size={13}
                        className="shrink-0 text-[var(--success)]"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-lg font-medium text-white">
                  Explicit limitation
                </div>

                <div className="mt-5 border border-[var(--line)] p-5">
                  <div className="flex items-start gap-3">
                    <Radio
                      size={16}
                      className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                    />

                    <p className="text-xs leading-6 text-[var(--text-secondary)]">
                      AWS Kinesis was kept as the intended managed ingestion
                      layer, but actual Kinesis deployment was not completed
                      because the AWS account had service-access limitations.
                      The continuous ingestion requirement was instead
                      validated through local PySpark Structured Streaming.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LINKS */}
        <section className="py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/dashboard"
              className="bg-[var(--surface)] p-7 transition-colors hover:bg-white/[0.03]"
            >
              <Activity
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="mt-6 text-lg font-medium text-white">
                Dashboard
              </div>

              <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                Executive sales overview.
              </p>

              <div className="ns-link mt-5 inline-flex items-center gap-2 text-[11px]">
                Open dashboard
                <ArrowRight size={12} />
              </div>
            </a>

            <a
              href="/forecast"
              className="bg-[var(--surface)] p-7 transition-colors hover:bg-white/[0.03]"
            >
              <Activity
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="mt-6 text-lg font-medium text-white">
                Forecast
              </div>

              <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                Seven-day model output.
              </p>

              <div className="ns-link mt-5 inline-flex items-center gap-2 text-[11px]">
                Open forecast
                <ArrowRight size={12} />
              </div>
            </a>

            <a
              href="/ai-insights"
              className="bg-[var(--surface)] p-7 transition-colors hover:bg-white/[0.03]"
            >
              <BrainCircuit
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="mt-6 text-lg font-medium text-white">
                AI Insights
              </div>

              <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                Explainable business context.
              </p>

              <div className="ns-link mt-5 inline-flex items-center gap-2 text-[11px]">
                Open insights
                <ArrowRight size={12} />
              </div>
            </a>

            <a
              href="/developers"
              className="bg-[var(--surface)] p-7 transition-colors hover:bg-white/[0.03]"
            >
              <Terminal
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="mt-6 text-lg font-medium text-white">
                Developers
              </div>

              <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                Architecture and engineering details.
              </p>

              <div className="ns-link mt-5 inline-flex items-center gap-2 text-[11px]">
                Open developers
                <ArrowRight size={12} />
              </div>
            </a>
          </div>
        </section>
      </div>

      <footer className="ns-footer">
        <div className="ns-container flex flex-col gap-6 py-9 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="font-medium text-[var(--text-secondary)]">
              NovaSales
            </div>

            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              System & Infrastructure
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="/" className="ns-footer-link">
              Home
            </a>

            <a href="/dashboard" className="ns-footer-link">
              Dashboard
            </a>

            <a href="/forecast" className="ns-footer-link">
              Forecast
            </a>

            <a href="/analytics" className="ns-footer-link">
              Analytics
            </a>

            <a href="/ai-insights" className="ns-footer-link">
              AI Insights
            </a>

            <a href="/system" className="ns-footer-link">
              System
            </a>

            <a href="/developers" className="ns-footer-link">
              Developers
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}