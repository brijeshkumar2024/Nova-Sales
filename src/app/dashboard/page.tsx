"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Database,
  Layers3,
  LineChart,
  Map,
  Package,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
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

type HistoryRecord = {
  date: string;
  daily_sales_inr: number;
  daily_quantity: number;
  daily_transactions: number;
  active_products: number;
  active_regions: number;
};

type ForecastRecord = {
  date: string;
  forecast_sales_inr: number;
};

type Region = {
  region: string;
  total_sales_inr: number;
  total_quantity: number;
  total_transactions: number;
};

type Product = {
  product_id: string;
  product_name: string;
  category: string;
  total_sales_inr: number;
  total_quantity: number;
  total_transactions: number;
};

type Metrics = {
  best_model: string;
  test_days: number;
  train_rows: number;
  test_rows: number;
  metrics: {
    model: string;
    MAE: number;
    RMSE: number;
    MAPE: number;
  }[];
};

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `₹${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `₹${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }

  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to connect to the NovaSales API.";
}

function MetricCard({
  label,
  value,
  meta,
  negative,
}: {
  label: string;
  value: string;
  meta: string;
  negative?: boolean;
}) {
  return (
    <div className="ns-kpi">
      <div className="flex items-start justify-between gap-4">
        <div className="ns-kpi-label">{label}</div>

        <div
          className={`h-1.5 w-1.5 ${
            negative ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
          }`}
        />
      </div>

      <div className="ns-kpi-value">{value}</div>

      <div
        className={`ns-kpi-meta ${
          negative ? "text-[var(--danger)]" : ""
        }`}
      >
        {meta}
      </div>
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
      <div>
        <div className="ns-panel-title">{eyebrow}</div>
        <div className="mt-1 text-sm font-medium text-white">{title}</div>
      </div>

      {action && (
        <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {action}
        </span>
      )}
    </div>
  );
}

function SalesChart({
  history,
  forecast,
}: {
  history: HistoryRecord[];
  forecast: ForecastRecord[];
}) {
  const chartData = useMemo(() => {
    const historical = history.slice(-60);

    const values = historical.map((item) => item.daily_sales_inr);
    const forecastValues = forecast.map((item) => item.forecast_sales_inr);

    const allValues = [...values, ...forecastValues];

    if (!allValues.length) {
      return null;
    }

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    const width = 1000;
    const height = 310;
    const paddingX = 18;
    const paddingY = 25;

    const toPoint = (
      value: number,
      index: number,
      count: number
    ) => {
      const x =
        paddingX +
        (index / Math.max(count - 1, 1)) *
          (width - paddingX * 2);

      const y =
        height -
        paddingY -
        ((value - min) / range) *
          (height - paddingY * 2);

      return `${x},${y}`;
    };

    const actualPoints = values
      .map((value, index) =>
        toPoint(value, index, values.length)
      )
      .join(" ");

    const forecastStartX =
      paddingX +
      ((values.length - 1) /
        Math.max(values.length + forecastValues.length - 1, 1)) *
        (width - paddingX * 2);

    const forecastPoints = forecastValues
      .map((value, index) => {
        const combinedIndex = values.length - 1 + index;

        const x =
          paddingX +
          (combinedIndex /
            Math.max(
              values.length + forecastValues.length - 1,
              1
            )) *
            (width - paddingX * 2);

        const y =
          height -
          paddingY -
          ((value - min) / range) *
            (height - paddingY * 2);

        return `${x},${y}`;
      })
      .join(" ");

    return {
      actualPoints,
      forecastPoints,
      forecastStartX,
      width,
      height,
      latestActual: values.at(-1) ?? 0,
      latestForecast: forecastValues.at(0) ?? 0,
    };
  }, [history, forecast]);

  if (!chartData) {
    return (
      <div className="flex h-[330px] items-center justify-center text-sm text-[var(--text-muted)]">
        No chart data available.
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-medium tracking-[-0.035em] text-white">
            {formatCurrency(chartData.latestActual)}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            Latest recorded daily sales
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 bg-[var(--text-secondary)]" />
            Actual
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
            <span className="h-1.5 w-1.5 bg-[var(--accent)]" />
            Forecast
          </div>
        </div>
      </div>

      <div className="ns-chart-grid relative h-[300px] overflow-hidden border border-[var(--line)] bg-[var(--bg-elevated)]">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <polyline
            points={chartData.actualPoints}
            fill="none"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={chartData.forecastPoints}
            fill="none"
            stroke="#c8f45a"
            strokeWidth="2.2"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <line
            x1={chartData.forecastStartX}
            y1="15"
            x2={chartData.forecastStartX}
            y2="295"
            stroke="rgba(200,244,90,0.22)"
            strokeDasharray="4 5"
          />
        </svg>

        <div className="absolute left-3 top-3 text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Daily sales
        </div>

        <div className="absolute bottom-3 left-3 text-[9px] text-[var(--text-muted)]">
          Historical
        </div>

        <div className="absolute bottom-3 right-3 text-[9px] text-[var(--accent)]">
          Forecast
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [forecast, setForecast] = useState<ForecastRecord[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const responses = await Promise.all([
        fetch(`${API_BASE}/sales/summary`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/sales/history?limit=90`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/forecast/future?limit=7`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/sales/regions`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/sales/products/top?limit=5`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/metrics`, {
          cache: "no-store",
        }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error(
          "One or more NovaSales API endpoints returned an error."
        );
      }

      const [
        summaryData,
        historyData,
        forecastData,
        regionsData,
        productsData,
        metricsData,
      ] = await Promise.all(
        responses.map((response) => response.json())
      );

      setSummary(summaryData);
      setHistory(historyData.records ?? []);
      setForecast(forecastData.records ?? []);
      setRegions(regionsData.records ?? []);
      setProducts(productsData.records ?? []);
      setMetrics(metricsData);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
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
          </div>
        </header>

        <div className="ns-container py-20">
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <RefreshCw
              size={16}
              className="animate-spin text-[var(--accent)]"
            />
            Loading operational data...
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
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
          </div>
        </header>

        <div className="ns-container py-20">
          <div className="max-w-xl border border-[var(--line)] bg-[var(--surface)] p-7">
            <CircleAlert
              size={20}
              className="text-[var(--danger)]"
            />

            <h1 className="mt-6 text-xl font-medium text-white">
              Dashboard unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {error ||
                "The NovaSales API did not return the expected dashboard data."}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={loadDashboard}
                className="ns-button-primary"
              >
                Retry
                <RefreshCw size={14} />
              </button>

              <a href="/" className="ns-button-secondary">
                Return home
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const growthNegative = summary.sales_growth_percent < 0;

  const regionMax =
    regions.length > 0
      ? Math.max(...regions.map((item) => item.total_sales_inr))
      : 1;

  const forecastTotal = forecast.reduce(
    (sum, item) => sum + item.forecast_sales_inr,
    0
  );

  const bestMetric =
    metrics?.metrics.find(
      (item) => item.model === metrics.best_model
    ) ?? metrics?.metrics[0];

  return (
    <main className="ns-page">
      {/* HEADER */}
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
            <a
              href="/dashboard"
              className="bg-white/[0.045] px-3 py-2 text-xs text-white"
            >
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

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[var(--success)] sm:flex">
              <span className="ns-status-dot" />
              API Connected
            </div>

            <button
              onClick={loadDashboard}
              className="ns-button-secondary"
              title="Refresh dashboard"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="ns-container">
        {/* PAGE HEADER */}
        <section className="border-b border-[var(--line)] py-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="ns-eyebrow">
                Executive dashboard
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">
                Sales command center
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Current sales performance, forward forecast, regional
                contribution, and model performance from the NovaSales
                backend.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <CalendarDays size={14} />
              Data through {formatDate(summary.latest_date)}
            </div>
          </div>
        </section>

        {/* KPI GRID */}
        <section className="grid border-x border-b border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total sales"
            value={formatCurrency(summary.total_sales_inr)}
            meta="Historical normalized sales"
          />

          <MetricCard
            label="Latest daily sales"
            value={formatCurrency(summary.latest_sales_inr)}
            meta={`${summary.sales_growth_percent.toFixed(1)}% vs previous day`}
            negative={growthNegative}
          />

          <MetricCard
            label="Transactions"
            value={formatNumber(summary.total_transactions)}
            meta={`${formatNumber(summary.total_quantity)} units sold`}
          />

          <MetricCard
            label="Next 7-day forecast"
            value={formatCurrency(forecastTotal)}
            meta={`${summary.active_regions} active regions`}
          />
        </section>

        {/* MAIN CHART */}
        <section className="mt-6 border border-[var(--line)] bg-[var(--surface)]">
          <PanelHeader
            eyebrow="Performance"
            title="Actual sales and forward forecast"
            action="90-day view + 7-day forecast"
          />

          <SalesChart
            history={history}
            forecast={forecast}
          />
        </section>

        {/* SECOND ROW */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* REGIONS */}
          <div className="border border-[var(--line)] bg-[var(--surface)]">
            <PanelHeader
              eyebrow="Regional performance"
              title="Sales by region"
              action="All regions"
            />

            <div className="divide-y divide-[var(--line)]">
              {regions.map((region) => {
                const percentage =
                  (region.total_sales_inr / regionMax) * 100;

                return (
                  <div
                    key={region.region}
                    className="px-5 py-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {region.region}
                        </div>

                        <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                          {formatNumber(region.total_transactions)}{" "}
                          transactions
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {formatCurrency(region.total_sales_inr)}
                        </div>

                        <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                          {formatNumber(region.total_quantity)} units
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-1 bg-white/[0.04]">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FORECAST */}
          <div className="border border-[var(--line)] bg-[var(--surface)]">
            <PanelHeader
              eyebrow="Forward outlook"
              title="7-day forecast"
              action="XGBoost"
            />

            <div className="divide-y divide-[var(--line)]">
              {forecast.map((item, index) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="ns-mono text-[9px] text-[var(--text-muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <div className="text-sm text-white">
                        {shortDate(item.date)}
                      </div>

                      <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                        Forecast
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-white">
                    {formatCurrency(item.forecast_sales_inr)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="mt-6 border border-[var(--line)] bg-[var(--surface)]">
          <PanelHeader
            eyebrow="Product performance"
            title="Top-selling products"
            action="By total sales"
          />

          <div className="divide-y divide-[var(--line)]">
            {products.map((product, index) => (
              <div
                key={product.product_id}
                className="grid items-center gap-5 px-5 py-5 sm:grid-cols-[36px_1fr_auto_auto]"
              >
                <div className="ns-mono text-[10px] text-[var(--text-muted)]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center border border-[var(--line)] bg-[var(--surface-2)]">
                    <Package
                      size={15}
                      strokeWidth={1.4}
                      className="text-[var(--text-muted)]"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-white">
                      {product.product_name}
                    </div>

                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {product.product_id} · {product.category}
                    </div>
                  </div>
                </div>

                <div className="hidden text-right sm:block">
                  <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Units
                  </div>
                  <div className="mt-1 text-xs text-white">
                    {formatNumber(product.total_quantity)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {formatCurrency(product.total_sales_inr)}
                  </div>

                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {formatNumber(product.total_transactions)} transactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MODEL + SYSTEM */}
        <section className="my-6 grid gap-6 lg:grid-cols-2">
          <div className="border border-[var(--line)] bg-[var(--surface)]">
            <PanelHeader
              eyebrow="Forecast evaluation"
              title="Model performance"
              action="Held-out test set"
            />

            <div className="p-5">
              {metrics && (
                <>
                  <div className="mb-6 border border-[var(--line)] bg-[var(--surface-2)] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="ns-kpi-label">
                          Selected model
                        </div>

                        <div className="mt-2 text-xl font-medium tracking-[-0.03em] text-white">
                          {metrics.best_model}
                        </div>
                      </div>

                      <TrendingUp
                        size={20}
                        strokeWidth={1.5}
                        className="text-[var(--accent)]"
                      />
                    </div>

                    {bestMetric && (
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div>
                          <div className="ns-kpi-label">MAE</div>
                          <div className="mt-2 text-xs text-white">
                            {formatCurrency(bestMetric.MAE)}
                          </div>
                        </div>

                        <div>
                          <div className="ns-kpi-label">RMSE</div>
                          <div className="mt-2 text-xs text-white">
                            {formatCurrency(bestMetric.RMSE)}
                          </div>
                        </div>

                        <div>
                          <div className="ns-kpi-label">MAPE</div>
                          <div className="mt-2 text-xs text-white">
                            {bestMetric.MAPE.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {metrics.metrics.map((metric) => (
                      <div
                        key={metric.model}
                        className="flex items-center justify-between border-b border-[var(--line)] pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <div className="text-sm text-white">
                            {metric.model}
                          </div>

                          <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                            MAPE {metric.MAPE.toFixed(1)}%
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-[var(--text-secondary)]">
                            RMSE
                          </div>

                          <div className="mt-1 text-xs text-white">
                            {formatCurrency(metric.RMSE)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border border-[var(--line)] bg-[var(--surface)]">
            <PanelHeader
              eyebrow="System"
              title="NovaSales operational state"
              action="Backend services"
            />

            <div className="divide-y divide-[var(--line)]">
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <Database
                    size={16}
                    className="text-[var(--text-muted)]"
                  />

                  <div>
                    <div className="text-sm text-white">
                      Sales data
                    </div>

                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {formatNumber(summary.total_transactions)} records
                    </div>
                  </div>
                </div>

                <span className="ns-status">
                  <span className="ns-status-dot" />
                  Available
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <LineChart
                    size={16}
                    className="text-[var(--text-muted)]"
                  />

                  <div>
                    <div className="text-sm text-white">
                      Forecasting
                    </div>

                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {metrics?.best_model ?? "Model"} selected
                    </div>
                  </div>
                </div>

                <span className="ns-status">
                  <span className="ns-status-dot" />
                  Available
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <Server
                    size={16}
                    className="text-[var(--text-muted)]"
                  />

                  <div>
                    <div className="text-sm text-white">
                      FastAPI
                    </div>

                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                      Operational API layer
                    </div>
                  </div>
                </div>

                <span className="ns-status">
                  <span className="ns-status-dot" />
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <Map
                    size={16}
                    className="text-[var(--text-muted)]"
                  />

                  <div>
                    <div className="text-sm text-white">
                      Regional coverage
                    </div>

                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {summary.active_regions} active regions
                    </div>
                  </div>
                </div>

                <span className="ns-status">
                  <span className="ns-status-dot" />
                  Available
                </span>
              </div>
            </div>

            <div className="border-t border-[var(--line)] p-5">
              <a
                href="/system"
                className="group flex items-center justify-between border border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-3 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-white"
              >
                Open system status

                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="ns-footer">
        <div className="ns-container flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-medium text-[var(--text-secondary)]">
              NovaSales
            </span>
            <span className="mx-2">/</span>
            Sales Intelligence Platform
          </div>

          <div className="flex items-center gap-6">
            <a href="/" className="ns-footer-link">
              Home
            </a>

            <a href="/developers" className="ns-footer-link">
              Developers
            </a>

            <a href="/terms" className="ns-footer-link">
              Terms
            </a>

            <a href="/privacy" className="ns-footer-link">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}