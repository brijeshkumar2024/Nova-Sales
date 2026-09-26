"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LineChart,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";

type ForecastRecord = {
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

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "₹0";

  if (Math.abs(value) >= 1_000_000_000) {
    return `₹${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `₹${(value / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }

  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatFullCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMetric(value: number) {
  return Math.round(value).toLocaleString("en-IN");
}

function formatMcap(value: number) {
  return `${value.toFixed(1)}%`;
}

function StatusDot() {
  return <span className="ns-status-dot" />;
}

export default function ForecastPage() {
  const [forecast, setForecast] = useState<ForecastRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const [forecastResponse, metricsResponse] = await Promise.all([
        fetch(`${API_BASE}/forecast/future?limit=7`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/metrics`, {
          cache: "no-store",
        }),
      ]);

      if (!forecastResponse.ok) {
        throw new Error("Forecast API request failed.");
      }

      if (!metricsResponse.ok) {
        throw new Error("Metrics API request failed.");
      }

      const forecastData = await forecastResponse.json();
      const metricsData = await metricsResponse.json();

      setForecast(
        Array.isArray(forecastData.records)
          ? forecastData.records
          : Array.isArray(forecastData)
            ? forecastData
            : [],
      );

      setMetrics(metricsData);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load forecast data. Make sure the NovaSales FastAPI server is running on port 8000.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const chartData = useMemo(
    () =>
      forecast.map((item) => ({
        date: formatDate(item.date),
        fullDate: item.date,
        forecast: item.forecast_sales_inr,
      })),
    [forecast],
  );

  const totalForecast = useMemo(
    () => forecast.reduce((sum, item) => sum + item.forecast_sales_inr, 0),
    [forecast],
  );

  const averageForecast = useMemo(
    () => (forecast.length ? totalForecast / forecast.length : 0),
    [forecast, totalForecast],
  );

  const highestForecast = useMemo(() => {
    if (!forecast.length) return null;

    return forecast.reduce((highest, current) =>
      current.forecast_sales_inr > highest.forecast_sales_inr
        ? current
        : highest,
    );
  }, [forecast]);

  const lowestForecast = useMemo(() => {
    if (!forecast.length) return null;

    return forecast.reduce((lowest, current) =>
      current.forecast_sales_inr < lowest.forecast_sales_inr
        ? current
        : lowest,
    );
  }, [forecast]);

  const selectedMetric = useMemo(() => {
    if (!metrics) return null;

    return (
      metrics.metrics.find((metric) => metric.model === metrics.best_model) ??
      metrics.metrics[0] ??
      null
    );
  }, [metrics]);

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
            className="ns-button-secondary"
            disabled={refreshing}
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
              <div className="ns-eyebrow">Forecast Studio</div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                Seven days ahead, backed by evaluated models.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                NovaSales generates a seven-day sales forecast from the
                trained forecasting pipeline and exposes the model evaluation
                metrics alongside the prediction.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/analytics" className="ns-button-primary">
                  Explore analytics
                  <ArrowRight size={15} />
                </a>

                <a href="/ai-insights" className="ns-button-secondary">
                  AI explanation
                  <BrainCircuit size={15} />
                </a>
              </div>
            </div>

            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <Target
                    size={15}
                    className="text-[var(--accent)]"
                  />
                  <span className="ns-panel-title">
                    Forecast configuration
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--success)]">
                  <StatusDot />
                  Live API
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div className="border-b border-r border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {forecast.length || 7}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Forecast days
                  </div>
                </div>

                <div className="border-b border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {metrics?.best_model ?? "—"}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Selected model
                  </div>
                </div>

                <div className="border-r border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {metrics?.test_days ?? "—"}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Test days
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-2xl font-medium text-white">
                    {selectedMetric ? formatMcap(selectedMetric.MAPE) : "—"}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    MAPE
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
                <Clock3
                  size={16}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>
                  <div className="text-sm font-medium text-white">
                    Forecast service unavailable
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {error}
                  </p>

                  <button
                    onClick={() => loadData(true)}
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

        {/* KPI GRID */}
        <section className="border-b border-[var(--line)] py-10">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">7-day forecast</div>

              <div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
                {loading ? "—" : formatCurrency(totalForecast)}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Combined forecast value
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Daily average</div>

              <div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
                {loading ? "—" : formatCurrency(averageForecast)}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Average projected sales
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Peak day</div>

              <div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
                {loading || !highestForecast
                  ? "—"
                  : formatCurrency(highestForecast.forecast_sales_inr)}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {highestForecast
                  ? formatLongDate(highestForecast.date)
                  : "Awaiting forecast"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Model MAPE</div>

              <div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
                {selectedMetric
                  ? formatMcap(selectedMetric.MAPE)
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Evaluated test observations
              </div>
            </div>
          </div>
        </section>

        {/* FORECAST CHART */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ns-eyebrow">Forward projection</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Expected daily sales
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Seven consecutive daily predictions generated by the current
                forecasting pipeline.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              <LineChart size={14} />
              Forecast series
            </div>
          </div>

          <div className="mt-10 border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6">
            {loading ? (
              <div className="flex h-[360px] items-center justify-center text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Loading forecast...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-[360px] items-center justify-center text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                No forecast data available
              </div>
            ) : (
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={chartData}
                    margin={{
                      top: 15,
                      right: 15,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.07)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#737982",
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#737982",
                        fontSize: 10,
                      }}
                      tickFormatter={(value) =>
                        `₹${Math.round(value / 1000000)}M`
                      }
                      width={60}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#111315",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 0,
                        color: "#ffffff",
                      }}
                      labelStyle={{
                        color: "#8d9299",
                        fontSize: 11,
                      }}
                      formatter={(value) => [
                        formatFullCurrency(Number(value)),
                        "Forecast",
                      ]}
                    />

                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#c7f36b"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "#c7f36b",
                        stroke: "#111315",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* DAILY FORECAST */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Daily forecast</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
                Seven-day outlook.
              </h2>

              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                The exact daily values returned by the forecasting API.
              </p>

              {lowestForecast && (
                <div className="mt-8 border border-[var(--line)] bg-[var(--surface)] p-5">
                  <div className="ns-kpi-label">Lowest projected day</div>

                  <div className="mt-3 text-2xl font-medium text-white">
                    {formatCurrency(lowestForecast.forecast_sales_inr)}
                  </div>

                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    {formatLongDate(lowestForecast.date)}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              <div className="grid grid-cols-[1fr_auto] border-b border-[var(--line)] px-6 py-4">
                <div className="ns-kpi-label">Date</div>
                <div className="ns-kpi-label">Forecast sales</div>
              </div>

              {loading ? (
                <div className="px-6 py-10 text-xs text-[var(--text-muted)]">
                  Loading...
                </div>
              ) : (
                forecast.map((item, index) => (
                  <div
                    key={item.date}
                    className="grid grid-cols-[1fr_auto] items-center border-b border-[var(--line)] px-6 py-5 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="ns-mono w-5 text-[9px] text-[var(--text-muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <div className="text-sm text-white">
                          {formatLongDate(item.date)}
                        </div>

                        <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                          {index === 0
                            ? "Next day"
                            : `${index + 1}-day horizon`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-medium text-white">
                        {formatFullCurrency(item.forecast_sales_inr)}
                      </div>

                      <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        Projected
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* MODEL PERFORMANCE */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ns-eyebrow">Model evaluation</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Compare the forecasting approaches.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Metrics are calculated on the chronological held-out test
                period. Lower MAE, RMSE, and MAPE indicate smaller errors for
                those respective measures.
              </p>
            </div>

            {metrics && (
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--success)]">
                <CheckCircle2 size={14} />
                {metrics.best_model} selected by lowest RMSE
              </div>
            )}
          </div>

          <div className="mt-10 overflow-hidden border border-[var(--line)] bg-[var(--surface)]">
            <div className="grid min-w-[700px] grid-cols-[1.2fr_1fr_1fr_0.8fr] border-b border-[var(--line)] px-6 py-4">
              <div className="ns-kpi-label">Model</div>
              <div className="ns-kpi-label">MAE</div>
              <div className="ns-kpi-label">RMSE</div>
              <div className="ns-kpi-label">MAPE</div>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-xs text-[var(--text-muted)]">
                Loading model metrics...
              </div>
            ) : (
              <div className="min-w-[700px]">
                {metrics?.metrics.map((metric) => {
                  const selected = metric.model === metrics.best_model;

                  return (
                    <div
                      key={metric.model}
                      className={`grid grid-cols-[1.2fr_1fr_1fr_0.8fr] items-center border-b border-[var(--line)] px-6 py-5 last:border-b-0 ${
                        selected ? "bg-white/[0.025]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {selected ? (
                          <CheckCircle2
                            size={14}
                            className="text-[var(--accent)]"
                          />
                        ) : (
                          <span className="h-3.5 w-3.5" />
                        )}

                        <div>
                          <div className="text-sm text-white">
                            {metric.model}
                          </div>

                          {selected && (
                            <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--accent)]">
                              Selected
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-[var(--text-secondary)]">
                        {formatMetric(metric.MAE)}
                      </div>

                      <div className="text-sm text-[var(--text-secondary)]">
                        {formatMetric(metric.RMSE)}
                      </div>

                      <div className="text-sm text-[var(--text-secondary)]">
                        {formatMcap(metric.MAPE)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* EVALUATION WINDOW */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[var(--surface)] p-6">
              <CalendarDays
                size={17}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">Training period</div>

              <div className="mt-3 text-sm text-white">
                {metrics
                  ? `${formatDate(metrics.train_start)} → ${formatDate(metrics.train_end)}`
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {metrics?.train_rows ?? "—"} training rows
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <BarChart3
                size={17}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">Test period</div>

              <div className="mt-3 text-sm text-white">
                {metrics
                  ? `${formatDate(metrics.test_start)} → ${formatDate(metrics.test_end)}`
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {metrics?.test_rows ?? "—"} test rows
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <TrendingUp
                size={17}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">Selected model</div>

              <div className="mt-3 text-sm text-white">
                {metrics?.best_model ?? "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Lowest RMSE selection criterion
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <Target
                size={17}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">Forecast horizon</div>

              <div className="mt-3 text-sm text-white">
                {forecast.length || 7} days
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Forward daily predictions
              </div>
            </div>
          </div>
        </section>

        {/* MODEL NOTE */}
        <section className="py-14 lg:py-20">
          <div className="border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <BrainCircuit
                size={18}
                className="mt-0.5 shrink-0 text-[var(--accent)]"
              />

              <div>
                <div className="text-sm font-medium text-white">
                  Forecasting and AI are separate layers
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  The forecasting model generates the numerical prediction.
                  Cohere is used separately for natural-language explanation
                  of structured forecast and business metrics. It does not
                  generate or modify the forecast itself.
                </p>

                <a
                  href="/ai-insights"
                  className="ns-link mt-5 inline-flex items-center gap-2 text-[11px]"
                >
                  View AI Insights
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>
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
              Forecast Studio
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