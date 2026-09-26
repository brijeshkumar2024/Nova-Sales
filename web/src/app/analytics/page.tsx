"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Map,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";

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

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "₹0";

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
  return Math.round(value).toLocaleString("en-IN");
}

const chartColors = [
  "#c7f36b",
  "#8fd3ff",
  "#d7a7ff",
  "#ffb86b",
  "#72e0c1",
];

export default function AnalyticsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const [regionsResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE}/sales/regions`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/sales/products/top?limit=10`, {
          cache: "no-store",
        }),
      ]);

      if (!regionsResponse.ok || !productsResponse.ok) {
        throw new Error("Analytics API request failed.");
      }

      const regionsData = await regionsResponse.json();
      const productsData = await productsResponse.json();

      setRegions(
        Array.isArray(regionsData.records) ? regionsData.records : [],
      );

      setProducts(
        Array.isArray(productsData.records) ? productsData.records : [],
      );
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load analytics. Make sure the NovaSales FastAPI server is running on port 8000.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalRegionalSales = useMemo(
    () => regions.reduce((sum, region) => sum + region.sales_inr, 0),
    [regions],
  );

  const totalRegionalTransactions = useMemo(
    () => regions.reduce((sum, region) => sum + region.transactions, 0),
    [regions],
  );

  const totalRegionalQuantity = useMemo(
    () => regions.reduce((sum, region) => sum + region.quantity, 0),
    [regions],
  );

  const topRegion = useMemo(() => {
    if (!regions.length) return null;

    return regions.reduce((top, current) =>
      current.sales_inr > top.sales_inr ? current : top,
    );
  }, [regions]);

  const topProduct = products[0] ?? null;

  const regionalChart = regions.map((region) => ({
    name: region.region,
    sales: region.sales_inr,
  }));

  const productChart = products.slice(0, 8).map((product) => ({
    name:
      product.product_name.length > 17
        ? `${product.product_name.slice(0, 17)}…`
        : product.product_name,
    sales: product.sales_inr,
  }));

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

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
            <div>
              <div className="ns-eyebrow">Sales Analytics</div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                Understand where sales are coming from.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                Regional and product-level performance from the unified
                NovaSales dataset, exposed through the live FastAPI analytics
                layer.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/dashboard" className="ns-button-primary">
                  Executive dashboard
                  <ArrowRight size={15} />
                </a>

                <a href="/forecast" className="ns-button-secondary">
                  View forecast
                  <TrendingUp size={15} />
                </a>
              </div>
            </div>

            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <BarChart3
                    size={15}
                    className="text-[var(--accent)]"
                  />
                  <span className="ns-panel-title">
                    Analytics snapshot
                  </span>
                </div>

                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--success)]">
                  <span className="ns-status-dot" />
                  Live API
                </span>
              </div>

              <div className="grid grid-cols-2">
                <div className="border-b border-r border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {loading ? "—" : regions.length}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Regions
                  </div>
                </div>

                <div className="border-b border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {loading ? "—" : products.length}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Products shown
                  </div>
                </div>

                <div className="border-r border-[var(--line)] p-5">
                  <div className="text-2xl font-medium text-white">
                    {loading
                      ? "—"
                      : formatCurrency(totalRegionalSales)}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Regional sales
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-2xl font-medium text-white">
                    {loading
                      ? "—"
                      : formatNumber(totalRegionalTransactions)}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Transactions
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
              <div className="text-sm font-medium text-white">
                Analytics service unavailable
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
          </section>
        )}

        {/* KPI */}
        <section className="border-b border-[var(--line)] py-10">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Top region</div>

              <div className="mt-4 text-2xl font-medium tracking-[-0.04em] text-white">
                {topRegion?.region ?? "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {topRegion
                  ? formatCurrency(topRegion.sales_inr)
                  : "Awaiting data"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Top product</div>

              <div className="mt-4 text-2xl font-medium tracking-[-0.04em] text-white">
                {topProduct?.product_name ?? "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {topProduct
                  ? formatCurrency(topProduct.sales_inr)
                  : "Awaiting data"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Quantity sold</div>

              <div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
                {loading ? "—" : formatNumber(totalRegionalQuantity)}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Across regional records
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6">
              <div className="ns-kpi-label">Transactions</div>

              <div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
                {loading
                  ? "—"
                  : formatNumber(totalRegionalTransactions)}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Across all regions
              </div>
            </div>
          </div>
        </section>

        {/* REGIONAL PERFORMANCE */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ns-eyebrow">Regional performance</div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Sales by region.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Regional sales contribution across the five active NovaSales
                markets.
              </p>
            </div>

            <Map size={18} className="text-[var(--text-muted)]" />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              {loading ? (
                <div className="flex h-[350px] items-center justify-center text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Loading regional data...
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalChart}
                      layout="vertical"
                      margin={{
                        top: 10,
                        right: 20,
                        left: 15,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.07)"
                        horizontal={false}
                      />

                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#737982",
                          fontSize: 10,
                        }}
                        tickFormatter={(value) =>
                          `₹${Math.round(value / 1_000_000_000)}B`
                        }
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#a9adb3",
                          fontSize: 11,
                        }}
                        width={65}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#111315",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 0,
                        }}
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          "Sales",
                        ]}
                      />

                      <Bar
                        dataKey="sales"
                        radius={[0, 1, 1, 0]}
                        barSize={30}
                      >
                        {regionalChart.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              <div className="border-b border-[var(--line)] px-6 py-5">
                <div className="ns-panel-title">
                  Regional breakdown
                </div>
              </div>

              {regions.map((region, index) => {
                const share =
                  totalRegionalSales > 0
                    ? (region.sales_inr / totalRegionalSales) * 100
                    : 0;

                return (
                  <div
                    key={region.region}
                    className="border-b border-[var(--line)] px-6 py-5 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2 w-2"
                          style={{
                            backgroundColor:
                              chartColors[index % chartColors.length],
                          }}
                        />

                        <span className="text-sm text-white">
                          {region.region}
                        </span>
                      </div>

                      <span className="text-xs text-[var(--text-muted)]">
                        {share.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-4 h-1 bg-white/[0.05]">
                      <div
                        className="h-full"
                        style={{
                          width: `${share}%`,
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{formatCurrency(region.sales_inr)}</span>
                      <span>
                        {formatNumber(region.transactions)} transactions
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div>
            <div className="ns-eyebrow">Product performance</div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Top-selling products.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Product-level ranking based on total INR-normalized sales.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
            <div className="border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              {loading ? (
                <div className="flex h-[360px] items-center justify-center text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Loading product data...
                </div>
              ) : (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productChart}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 55,
                      }}
                    >
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.07)"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        tick={{
                          fill: "#737982",
                          fontSize: 9,
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
                          `₹${Math.round(value / 1_000_000_000)}B`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#111315",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 0,
                        }}
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          "Sales",
                        ]}
                      />

                      <Bar
                        dataKey="sales"
                        fill="#c7f36b"
                        barSize={26}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              <div className="grid grid-cols-[55px_1fr_auto] border-b border-[var(--line)] px-6 py-4">
                <div className="ns-kpi-label">Rank</div>
                <div className="ns-kpi-label">Product</div>
                <div className="ns-kpi-label">Sales</div>
              </div>

              {products.map((product) => (
                <div
                  key={product.product_id}
                  className="grid grid-cols-[55px_1fr_auto] items-center border-b border-[var(--line)] px-6 py-5 last:border-b-0"
                >
                  <div className="ns-mono text-[10px] text-[var(--text-muted)]">
                    {String(product.rank).padStart(2, "0")}
                  </div>

                  <div>
                    <div className="text-sm text-white">
                      {product.product_name}
                    </div>

                    <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {product.category} · {product.product_id}
                    </div>

                    <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                      {formatNumber(product.quantity)} units ·{" "}
                      {formatNumber(product.transactions)} transactions
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(product.sales_inr)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCT INSIGHT */}
        <section className="py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
            <div className="bg-[var(--surface)] p-7">
              <Package
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">
                Highest-selling product
              </div>

              <div className="mt-3 text-xl font-medium text-white">
                {topProduct?.product_name ?? "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {topProduct
                  ? formatCurrency(topProduct.sales_inr)
                  : "Awaiting data"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-7">
              <ShoppingCart
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">
                Highest-volume region
              </div>

              <div className="mt-3 text-xl font-medium text-white">
                {regions.length
                  ? [...regions].sort(
                      (a, b) => b.quantity - a.quantity,
                    )[0]?.region
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {regions.length
                  ? `${formatNumber(
                      [...regions].sort(
                        (a, b) => b.quantity - a.quantity,
                      )[0]?.quantity ?? 0,
                    )} units`
                  : "Awaiting data"}
              </div>
            </div>

            <div className="bg-[var(--surface)] p-7">
              <TrendingUp
                size={18}
                className="text-[var(--accent)]"
              />

              <div className="ns-kpi-label mt-6">
                Highest transaction region
              </div>

              <div className="mt-3 text-xl font-medium text-white">
                {regions.length
                  ? [...regions].sort(
                      (a, b) => b.transactions - a.transactions,
                    )[0]?.region
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-[var(--text-muted)]">
                {regions.length
                  ? `${formatNumber(
                      [...regions].sort(
                        (a, b) => b.transactions - a.transactions,
                      )[0]?.transactions ?? 0,
                    )} transactions`
                  : "Awaiting data"}
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
              Sales Analytics
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