"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  ExternalLink,
  LineChart,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

type Summary = {
  total_sales_inr: number;
  average_daily_sales_inr: number;
  total_transactions: number;
  total_quantity: number;
  active_products: number;
  active_regions: number;
  latest_date: string;
  latest_sales_inr: number;
  previous_day_sales_inr: number;
  sales_growth_percent: number;
};

type Forecast = {
  date: string;
  forecast_sales_inr: number;
};

type Metric = {
  model: string;
  MAE: number;
  RMSE: number;
  MAPE: number;
};

type MetricsResponse = {
  best_model: string;
  test_days: number;
  train_rows: number;
  test_rows: number;
  train_start: string;
  train_end: string;
  test_start: string;
  test_end: string;
  metrics: Metric[];
};

type Region = {
  region: string;
  sales_inr: number;
  quantity: number;
  transactions: number;
};

type Product = {
  rank: number;
  product_id: string;
  product_name: string;
  category: string;
  sales_inr: number;
  quantity: number;
  transactions: number;
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactINR(value: number) {
  if (value >= 1_000_000_000) {
    return `₹${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `₹${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }

  return formatINR(value);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSignal(
  growth: number,
  forecast: number,
  average: number,
  bestModel: string,
) {
  const signals: {
    title: string;
    description: string;
    type: "positive" | "negative" | "neutral";
  }[] = [];

  if (growth < 0) {
    signals.push({
      title: "Recent sales contraction",
      description: `The latest daily sales value is ${Math.abs(
        growth,
      ).toFixed(
        1,
      )}% below the previous day. This is a short-term movement in the observed series, not a causal diagnosis.`,
      type: "negative",
    });
  } else {
    signals.push({
      title: "Recent sales expansion",
      description: `The latest daily sales value is ${growth.toFixed(
        1,
      )}% above the previous day. This indicates positive short-term movement in the observed series.`,
      type: "positive",
    });
  }

  if (forecast > average) {
    signals.push({
      title: "Forecast above historical daily average",
      description: `The first forecast value is ${formatCompactINR(
        forecast,
      )}, compared with the historical daily average of ${formatCompactINR(
        average,
      )}.`,
      type: "positive",
    });
  } else {
    signals.push({
      title: "Forecast below historical daily average",
      description: `The first forecast value is ${formatCompactINR(
        forecast,
      )}, compared with the historical daily average of ${formatCompactINR(
        average,
      )}.`,
      type: "negative",
    });
  }

  signals.push({
    title: `${bestModel} selected for production output`,
    description:
      "The selected model is determined from the configured chronological evaluation using the model metadata and validation metrics.",
    type: "neutral",
  });

  return signals;
}

export default function AIInsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const responses = await Promise.all([
        fetch(`${API_BASE}/sales/summary`, { cache: "no-store" }),
        fetch(`${API_BASE}/forecast/future?limit=7`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/metrics`, { cache: "no-store" }),
        fetch(`${API_BASE}/sales/regions`, { cache: "no-store" }),
        fetch(`${API_BASE}/sales/products/top?limit=5`, {
          cache: "no-store",
        }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("One or more API requests failed.");
      }

      const [
        summaryData,
        forecastData,
        metricsData,
        regionsData,
        productsData,
      ] = await Promise.all(responses.map((response) => response.json()));

      setSummary(summaryData);
      setForecast(forecastData.records ?? []);
      setMetrics(metricsData);
      setRegions(regionsData.records ?? []);
      setProducts(productsData.records ?? []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load AI insight context. Make sure the NovaSales API is running on port 8000.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedMetric = useMemo(() => {
    if (!metrics) return null;

    return (
      metrics.metrics.find(
        (metric) => metric.model === metrics.best_model,
      ) ?? null
    );
  }, [metrics]);

  const signals = useMemo(() => {
    if (!summary || !forecast.length || !metrics) return [];

    return getSignal(
      summary.sales_growth_percent,
      forecast[0]?.forecast_sales_inr ?? 0,
      summary.average_daily_sales_inr,
      metrics.best_model,
    );
  }, [summary, forecast, metrics]);

  const forecastTotal = useMemo(
    () =>
      forecast.reduce(
        (total, item) => total + item.forecast_sales_inr,
        0,
      ),
    [forecast],
  );

  const topRegion = regions[0];

  const topProduct = products[0];

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
            onClick={() => loadData(true)}
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
              <div className="ns-eyebrow">Explainable intelligence</div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                From forecast numbers to business context.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                NovaSales combines structured sales data, model evaluation,
                forecast output, and Cohere-based natural-language
                explanation into a single intelligence layer.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/forecast" className="ns-button-primary">
                  View forecast
                  <ArrowRight size={15} />
                </a>

                <a href="/analytics" className="ns-button-secondary">
                  Explore analytics
                  <BarChart3 size={15} />
                </a>
              </div>
            </div>

            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <BrainCircuit
                    size={15}
                    className="text-[var(--accent)]"
                  />

                  <span className="ns-panel-title">
                    Explanation layer
                  </span>
                </div>

                <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--success)]">
                  Structured
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--line)]">
                    <Sparkles
                      size={17}
                      className="text-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-white">
                      Cohere explanation
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                      Receives structured forecast context and produces
                      natural-language interpretation.
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-[var(--line)] pt-5">
                  <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Forecast ownership
                  </div>

                  <div className="mt-2 text-xs text-[var(--text-secondary)]">
                    Numerical forecast remains model-generated.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <section className="border-b border-[var(--line)] py-8">
            <div className="border border-red-500/20 bg-red-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <Activity
                  size={16}
                  className="mt-0.5 text-red-400"
                />

                <div>
                  <div className="text-sm font-medium text-white">
                    Insight context unavailable
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* KPI CONTEXT */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div>
            <div className="ns-eyebrow">Structured context</div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              The inputs behind the explanation.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              These values are fetched directly from the NovaSales API. They
              form the structured context used by the intelligence layer.
            </p>
          </div>

          <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <div className="ns-kpi">
              <div className="ns-kpi-label">Total sales</div>

              <div className="ns-kpi-value">
                {loading
                  ? "—"
                  : formatCompactINR(summary?.total_sales_inr ?? 0)}
              </div>

              <div className="ns-kpi-meta">
                Historical sales volume
              </div>
            </div>

            <div className="ns-kpi">
              <div className="ns-kpi-label">Daily average</div>

              <div className="ns-kpi-value">
                {loading
                  ? "—"
                  : formatCompactINR(
                      summary?.average_daily_sales_inr ?? 0,
                    )}
              </div>

              <div className="ns-kpi-meta">
                Average observed day
              </div>
            </div>

            <div className="ns-kpi">
              <div className="ns-kpi-label">Transactions</div>

              <div className="ns-kpi-value">
                {loading
                  ? "—"
                  : (summary?.total_transactions ?? 0).toLocaleString(
                      "en-IN",
                    )}
              </div>

              <div className="ns-kpi-meta">
                Historical transaction count
              </div>
            </div>

            <div className="ns-kpi">
              <div className="ns-kpi-label">Latest growth</div>

              <div className="ns-kpi-value">
                {loading
                  ? "—"
                  : `${summary?.sales_growth_percent.toFixed(1)}%`}
              </div>

              <div className="ns-kpi-meta">
                Latest day vs previous day
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS SIGNALS */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Business signals</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                What the current data says.
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                These signals are deterministic interpretations of API
                values. They do not claim causality and do not replace the
                model output.
              </p>
            </div>

            <div className="grid gap-px bg-[var(--line)]">
              {signals.map((signal, index) => (
                <article
                  key={signal.title}
                  className="bg-[var(--surface)] p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--line)]">
                      {signal.type === "positive" ? (
                        <TrendingUp
                          size={15}
                          className="text-[var(--success)]"
                        />
                      ) : signal.type === "negative" ? (
                        <TrendingDown
                          size={15}
                          className="text-red-400"
                        />
                      ) : (
                        <CheckCircle2
                          size={15}
                          className="text-[var(--accent)]"
                        />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-white">
                        {signal.title}
                      </div>

                      <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                        {signal.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Signal {String(index + 1).padStart(2, "0")}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FORECAST CONTEXT */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] lg:grid-cols-2">
            <div className="bg-[var(--surface)] p-7 lg:p-9">
              <LineChart
                size={19}
                className="text-[var(--accent)]"
              />

              <div className="ns-eyebrow mt-7">Forecast context</div>

              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                Seven-day projected sales.
              </h2>

              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                The numerical forecast comes from the configured forecasting
                pipeline. Cohere receives this structured output for
                explanation and does not modify the values.
              </p>

              <div className="mt-7 border border-[var(--line)]">
                {forecast.map((item) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 last:border-b-0"
                  >
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatDate(item.date)}
                    </span>

                    <span className="text-xs font-medium text-white">
                      {formatINR(item.forecast_sales_inr)}
                    </span>
                  </div>
                ))}

                {!forecast.length && (
                  <div className="p-5 text-xs text-[var(--text-muted)]">
                    {loading
                      ? "Loading forecast..."
                      : "No forecast records available."}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-7 lg:p-9">
              <Activity
                size={19}
                className="text-[var(--accent)]"
              />

              <div className="ns-eyebrow mt-7">Forecast summary</div>

              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                Model evaluation context.
              </h2>

              <div className="mt-7 grid grid-cols-2 gap-px bg-[var(--line)]">
                <div className="bg-[var(--surface)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {metrics?.best_model ?? "—"}
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Selected model
                  </div>
                </div>

                <div className="bg-[var(--surface)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {selectedMetric
                      ? `${selectedMetric.MAPE.toFixed(2)}%`
                      : "—"}
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Test MAPE
                  </div>
                </div>

                <div className="bg-[var(--surface)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {forecast.length || "—"}
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Forecast days
                  </div>
                </div>

                <div className="bg-[var(--surface)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {forecast.length
                      ? formatCompactINR(forecastTotal)
                      : "—"}
                  </div>

                  <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    7-day total
                  </div>
                </div>
              </div>

              <div className="mt-6 border border-[var(--line)] p-5">
                <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Important metric interpretation
                </div>

                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                  MAPE represents the average absolute percentage error on
                  the evaluated observations. It is not a guaranteed
                  prediction interval and should not be interpreted as a
                  promise that future values will fall within a fixed
                  percentage range.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REGIONAL + PRODUCT CONTEXT */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div>
            <div className="ns-eyebrow">Commercial context</div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Where the sales signal comes from.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Regional and product data provides additional structured
              context around the forecast and business signals.
            </p>
          </div>

          <div className="mt-10 grid gap-px bg-[var(--line)] lg:grid-cols-2">
            <div className="bg-[var(--surface)] p-7 lg:p-9">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database
                    size={17}
                    className="text-[var(--accent)]"
                  />

                  <span className="text-sm font-medium text-white">
                    Regional context
                  </span>
                </div>

                {topRegion && (
                  <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Highest sales region
                  </span>
                )}
              </div>

              <div className="mt-7">
                {regions.map((region) => (
                  <div
                    key={region.region}
                    className="border-b border-[var(--line)] py-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {region.region}
                      </span>

                      <span className="text-xs font-medium text-white">
                        {formatCompactINR(region.sales_inr)}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <span>
                        {region.transactions.toLocaleString("en-IN")}{" "}
                        transactions
                      </span>

                      <span>
                        {region.quantity.toLocaleString("en-IN")} units
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-7 lg:p-9">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3
                    size={17}
                    className="text-[var(--accent)]"
                  />

                  <span className="text-sm font-medium text-white">
                    Product context
                  </span>
                </div>

                {topProduct && (
                  <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Highest sales product
                  </span>
                )}
              </div>

              <div className="mt-7">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="border-b border-[var(--line)] py-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-xs text-white">
                          {product.product_name}
                        </div>

                        <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          {product.category}
                        </div>
                      </div>

                      <span className="shrink-0 text-xs font-medium text-white">
                        {formatCompactINR(product.sales_inr)}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <span>Rank #{product.rank}</span>

                      <span>
                        {product.quantity.toLocaleString("en-IN")} units
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COHERE ARCHITECTURE */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="ns-command-panel">
            <div className="ns-panel-header">
              <div className="flex items-center gap-3">
                <BrainCircuit
                  size={15}
                  className="text-[var(--accent)]"
                />

                <span className="ns-panel-title">
                  Explainability architecture
                </span>
              </div>

              <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Cohere
              </span>
            </div>

            <div className="grid gap-px bg-[var(--line)] lg:grid-cols-3">
              <div className="bg-[var(--surface)] p-7">
                <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  01 / Input
                </div>

                <h3 className="mt-4 text-lg font-medium text-white">
                  Structured context
                </h3>

                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                  Forecast values, evaluation metrics, recent sales signals,
                  regional context, and product information.
                </p>
              </div>

              <div className="bg-[var(--surface)] p-7">
                <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  02 / Reasoning surface
                </div>

                <h3 className="mt-4 text-lg font-medium text-white">
                  Natural-language explanation
                </h3>

                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                  Cohere is used to turn structured information into concise,
                  manager-readable business context.
                </p>
              </div>

              <div className="bg-[var(--surface)] p-7">
                <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  03 / Output
                </div>

                <h3 className="mt-4 text-lg font-medium text-white">
                  Explainable insight
                </h3>

                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                  The resulting explanation is presented alongside the
                  underlying numerical forecast and metrics.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--line)] p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={15}
                  className="mt-0.5 text-[var(--success)]"
                />

                <p className="text-xs leading-6 text-[var(--text-secondary)]">
                  Cohere is an explanation layer. It does not generate,
                  replace, or modify the numerical forecasting model's
                  output.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MODEL DETAILS */}
        <section className="py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Evaluation</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Chronological model validation.
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                The forecasting pipeline evaluates models using a time-aware
                train/test split rather than randomly shuffling observations.
              </p>
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              {metrics?.metrics.map((metric) => (
                <div
                  key={metric.model}
                  className="grid gap-5 border-b border-[var(--line)] p-6 last:border-b-0 sm:grid-cols-[1.3fr_1fr_1fr_1fr]"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {metric.model}
                    </div>

                    {metric.model === metrics.best_model && (
                      <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[var(--success)]">
                        Selected model
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      MAE
                    </div>

                    <div className="mt-2 text-xs text-white">
                      {formatCompactINR(metric.MAE)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      RMSE
                    </div>

                    <div className="mt-2 text-xs text-white">
                      {formatCompactINR(metric.RMSE)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      MAPE
                    </div>

                    <div className="mt-2 text-xs text-white">
                      {metric.MAPE.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              {!metrics && (
                <div className="p-6 text-xs text-[var(--text-muted)]">
                  {loading
                    ? "Loading evaluation metrics..."
                    : "Metrics unavailable."}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Training rows</div>

              <div className="mt-3 text-2xl font-medium text-white">
                {metrics?.train_rows.toLocaleString("en-IN") ?? "—"}
              </div>

              <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                {metrics
                  ? `${formatDate(metrics.train_start)} to ${formatDate(
                      metrics.train_end,
                    )}`
                  : "—"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Test rows</div>

              <div className="mt-3 text-2xl font-medium text-white">
                {metrics?.test_rows.toLocaleString("en-IN") ?? "—"}
              </div>

              <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                {metrics
                  ? `${formatDate(metrics.test_start)} to ${formatDate(
                      metrics.test_end,
                    )}`
                  : "—"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Evaluation window</div>

              <div className="mt-3 text-2xl font-medium text-white">
                {metrics?.test_days ?? "—"}
              </div>

              <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                test observations
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Latest date</div>

              <div className="mt-3 text-2xl font-medium text-white">
                {summary ? formatDate(summary.latest_date) : "—"}
              </div>

              <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                latest observed sales
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
            <a
              href="/analytics"
              className="bg-[var(--surface)] p-8 transition-colors hover:bg-white/[0.03] lg:p-10"
            >
              <BarChart3
                size={18}
                className="text-[var(--accent)]"
              />

              <h3 className="mt-6 text-xl font-medium tracking-[-0.03em] text-white">
                Explore commercial analytics
              </h3>

              <p className="mt-3 max-w-md text-xs leading-6 text-[var(--text-secondary)]">
                Review regional sales distribution and top-selling products
                using the same backend data.
              </p>

              <span className="ns-link mt-6 inline-flex items-center gap-2 text-[11px]">
                Explore analytics
                <ArrowRight size={12} />
              </span>
            </a>

            <a
              href="/system"
              className="bg-[var(--surface)] p-8 transition-colors hover:bg-white/[0.03] lg:p-10"
            >
              <Database
                size={18}
                className="text-[var(--accent)]"
              />

              <h3 className="mt-6 text-xl font-medium tracking-[-0.03em] text-white">
                Inspect the system
              </h3>

              <p className="mt-3 max-w-md text-xs leading-6 text-[var(--text-secondary)]">
                View the data pipeline, AWS infrastructure, streaming
                implementation, and API service status.
              </p>

              <span className="ns-link mt-6 inline-flex items-center gap-2 text-[11px]">
                Open system
                <ArrowRight size={12} />
              </span>
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
              Explainable Sales Intelligence
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