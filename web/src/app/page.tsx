"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Database,
  LineChart,
  Menu,
  Radio,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";

const platformLayers = [
  {
    number: "01",
    title: "Sales data",
    description: "Transactions across regions, products and currencies.",
    icon: Database,
  },
  {
    number: "02",
    title: "PySpark processing",
    description: "Cleaning, normalization and time-series aggregation.",
    icon: Server,
  },
  {
    number: "03",
    title: "Feature engineering",
    description: "Rolling averages, growth signals and model features.",
    icon: Activity,
  },
  {
    number: "04",
    title: "Forecasting",
    description: "Chronological evaluation across multiple forecasting models.",
    icon: LineChart,
  },
  {
    number: "05",
    title: "FastAPI",
    description: "A unified service layer for operational data and forecasts.",
    icon: Radio,
  },
  {
    number: "06",
    title: "Business interface",
    description: "Dashboards for sales managers and operational teams.",
    icon: BarChart3,
  },
];

const capabilities = [
  {
    eyebrow: "01 / Ingestion",
    title: "Continuous sales processing",
    description:
      "Incoming regional sales batches are processed through a structured streaming pipeline before being consolidated into the analytical layer.",
  },
  {
    eyebrow: "02 / Normalization",
    title: "One financial view",
    description:
      "Multi-currency transactions are normalized into INR so regional performance can be compared consistently.",
  },
  {
    eyebrow: "03 / Forecasting",
    title: "Forecasts backed by evaluation",
    description:
      "XGBoost, Prophet and hybrid forecasts are evaluated chronologically against held-out historical observations.",
  },
  {
    eyebrow: "04 / Explanation",
    title: "Context around the forecast",
    description:
      "Cohere generates structured natural-language explanations from the forecast and supporting business metrics.",
  },
];

function MiniSparkline() {
  const points =
    "0,106 28,101 56,108 84,92 112,97 140,78 168,84 196,63 224,70 252,48 280,55 308,38 336,44 364,27 392,35 420,20";

  return (
    <svg
      viewBox="0 0 420 125"
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-label="Sales trend preview"
      role="img"
    >
      <defs>
        <linearGradient id="homeAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,244,90,0.16)" />
          <stop offset="100%" stopColor="rgba(200,244,90,0)" />
        </linearGradient>
      </defs>

      <polygon points={`${points} 420,125 0,125`} fill="url(#homeAreaFill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#c8f45a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="420" cy="20" r="3" fill="#c8f45a" />
    </svg>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] py-3 last:border-0">
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      <span className="flex items-center gap-2 text-[11px] font-medium text-[var(--success)]">
        <span className="ns-status-dot" />
        {value}
      </span>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="ns-eyebrow">{eyebrow}</div>
      <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <main className="ns-page">
      {/* HEADER */}
      <header className="ns-header">
        <div className="ns-container ns-header-inner">
          <Link href="/" className="ns-brand" onClick={closeMobile}>
            <span className="ns-brand-mark" />
            <span>
              <span className="ns-brand-name block">NOVASALES</span>
              <span className="ns-brand-subtitle block">Sales Intelligence Platform</span>
            </span>
          </Link>

          <nav className="ns-nav" aria-label="Primary navigation">
            <a href="#platform" className="ns-nav-link">Platform</a>
            <a href="#analytics" className="ns-nav-link">Analytics</a>
            <a href="#architecture" className="ns-nav-link">Architecture</a>
            <a href="#developers" className="ns-nav-link">Developers</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="ns-button-secondary hidden sm:inline-flex">
              Open dashboard
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="ns-button-secondary !min-h-10 !px-3 lg:hidden"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-[var(--line)] bg-[rgba(6,8,9,0.97)] lg:hidden">
            <nav className="ns-container flex flex-col py-3" aria-label="Mobile navigation">
              <a href="#platform" onClick={closeMobile} className="border-b border-[var(--line)] py-4 text-sm text-[var(--text-secondary)]">
                Platform
              </a>
              <a href="#analytics" onClick={closeMobile} className="border-b border-[var(--line)] py-4 text-sm text-[var(--text-secondary)]">
                Analytics
              </a>
              <a href="#architecture" onClick={closeMobile} className="border-b border-[var(--line)] py-4 text-sm text-[var(--text-secondary)]">
                Architecture
              </a>
              <a href="#developers" onClick={closeMobile} className="border-b border-[var(--line)] py-4 text-sm text-[var(--text-secondary)]">
                Developers
              </a>
              <Link href="/dashboard" onClick={closeMobile} className="mt-3 ns-button-primary">
                Open dashboard
                <ArrowRight size={14} />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(200,244,90,0.045),transparent_65%)]" />

        <div className="ns-container relative py-20 sm:py-24 lg:py-32">
          <div className="grid items-end gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Operational sales intelligence</div>

              <h1 className="ns-display mt-7">
                Sales visibility,
                <br />
                built for decisions.
              </h1>

              <p className="ns-body mt-8 max-w-2xl">
                NovaSales brings regional sales data, forecasting, operational analytics,
                and structured business explanations into one system.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/dashboard" className="ns-button-primary">
                  View live dashboard
                  <ArrowRight size={15} />
                </Link>
                <a href="#architecture" className="ns-button-secondary">
                  Explore architecture
                </a>
              </div>

              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--line)] pt-5">
                {[
                  "PySpark pipeline",
                  "Forecast evaluation",
                  "FastAPI services",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.13em] text-[var(--text-muted)]">
                    <Check size={12} className="text-[var(--accent)]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* PRODUCT PREVIEW */}
            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 bg-[var(--success)]" />
                  <span className="ns-panel-title">Executive overview</span>
                </div>
                <span className="ns-mono text-[9px] text-[var(--text-muted)]">LIVE DATA</span>
              </div>

              <div className="grid grid-cols-2 border-b border-[var(--line)]">
                <div className="border-r border-[var(--line)] p-5">
                  <div className="ns-kpi-label">Latest sales</div>
                  <div className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">₹95.1M</div>
                  <div className="mt-2 text-[10px] text-[var(--danger)]">−32.3% vs previous day</div>
                </div>
                <div className="p-5">
                  <div className="ns-kpi-label">Next-day forecast</div>
                  <div className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">₹125.7M</div>
                  <div className="mt-2 text-[10px] text-[var(--text-muted)]">7-day horizon</div>
                </div>
              </div>

              <div className="border-b border-[var(--line)] p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="ns-kpi-label">Sales performance</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">Historical daily sales</div>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <span className="h-1.5 w-1.5 bg-[var(--accent)]" />
                    Actual
                  </div>
                </div>

                <div className="ns-chart-grid h-36 overflow-hidden">
                  <MiniSparkline />
                </div>

                <div className="mt-3 flex justify-between ns-mono text-[9px] text-[var(--text-muted)]">
                  <span>2024</span>
                  <span>2025</span>
                  <span>JUN 2026</span>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--line)]">
                <div className="p-4">
                  <div className="ns-kpi-label">Transactions</div>
                  <div className="mt-2 text-sm font-medium text-white">100K</div>
                </div>
                <div className="p-4">
                  <div className="ns-kpi-label">Regions</div>
                  <div className="mt-2 text-sm font-medium text-white">5</div>
                </div>
                <div className="p-4">
                  <div className="ns-kpi-label">Products</div>
                  <div className="mt-2 text-sm font-medium text-white">27</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="border-b border-[var(--line)] scroll-mt-24">
        <div className="ns-container py-24 lg:py-28">
          <SectionIntro
            eyebrow="Platform"
            title="The operational layer between sales data and business decisions."
            description="NovaSales separates ingestion, transformation, forecasting, and presentation into distinct layers. The result is a system that can be inspected at every stage."
          />

          <div className="mt-14 grid border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.eyebrow} className="bg-[var(--surface)] p-7 transition-colors hover:bg-[var(--surface-2)] lg:p-9">
                <div className="ns-mono text-[10px] tracking-[0.12em] text-[var(--accent)]">{item.eyebrow}</div>
                <h3 className="mt-8 text-xl font-medium tracking-[-0.025em] text-white">{item.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
              <span className="text-xs leading-5 text-[var(--text-secondary)]">
                Cloud storage, structured processing and an operational API layer work together as one pipeline.
              </span>
            </div>
            <Link href="/system" className="ns-link flex items-center gap-2 text-xs">
              System status <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ANALYTICS */}
      <section id="analytics" className="border-b border-[var(--line)] scroll-mt-24">
        <div className="ns-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionIntro
              eyebrow="Analytics"
              title="One view across sales performance."
              description="The business interface exposes the same operational outputs used by the backend services, giving managers a consistent view of current performance and forecast expectations."
            />

            <div>
              <div className="grid grid-cols-2 border border-[var(--line)] bg-[var(--line)]">
                <div className="ns-kpi">
                  <div className="ns-kpi-label">Historical transactions</div>
                  <div className="ns-kpi-value">100K</div>
                  <div className="ns-kpi-meta">Processed records</div>
                </div>
                <div className="ns-kpi">
                  <div className="ns-kpi-label">Historical sales</div>
                  <div className="ns-kpi-value">₹109.5B</div>
                  <div className="ns-kpi-meta">Normalized to INR</div>
                </div>
                <div className="ns-kpi">
                  <div className="ns-kpi-label">Active regions</div>
                  <div className="ns-kpi-value">5</div>
                  <div className="ns-kpi-meta">Regional sales view</div>
                </div>
                <div className="ns-kpi">
                  <div className="ns-kpi-label">Forecast horizon</div>
                  <div className="ns-kpi-value">7 days</div>
                  <div className="ns-kpi-meta">Forward forecast</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/analytics" className="ns-button-primary">
                  Open analytics
                  <ArrowRight size={14} />
                </Link>
                <Link href="/forecast" className="ns-button-secondary">
                  Forecast studio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="border-b border-[var(--line)] scroll-mt-24">
        <div className="ns-container py-24 lg:py-28">
          <SectionIntro
            eyebrow="Architecture"
            title="A modular pipeline from transaction to forecast."
            description="Every layer has a defined responsibility. Data is processed first, forecasting is evaluated separately, and the application layer consumes structured outputs."
          />

          <div className="mt-14 grid border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {platformLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <article key={layer.number} className="ns-architecture-node">
                  <div className="flex items-center justify-between">
                    <span className="ns-node-number">{layer.number}</span>
                    <Icon size={17} strokeWidth={1.4} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="ns-node-title">{layer.title}</h3>
                  <p className="ns-node-description">{layer.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-3 border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <ShieldCheck size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
            <span className="text-xs leading-5 text-[var(--text-secondary)]">
              AWS S3 provides the cloud storage layer. Local PySpark Structured Streaming was used to validate continuous ingestion where managed Kinesis access was unavailable.
            </span>
          </div>
        </div>
      </section>

      {/* DEVELOPERS */}
      <section id="developers" className="border-b border-[var(--line)] scroll-mt-24">
        <div className="ns-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <SectionIntro
              eyebrow="Developers"
              title="Engineered as a working system."
              description="NovaSales brings together data engineering, machine learning, backend development, cloud storage, and business visualization in one project."
            />

            <div>
              <div className="border border-[var(--line)] bg-[var(--surface)]">
                <div className="border-b border-[var(--line)] px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="ns-panel-title">Engineering stack</span>
                    <span className="ns-status"><span className="ns-status-dot" /> SYSTEM READY</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2">
                  <div className="border-b border-[var(--line)] p-6 sm:border-r">
                    <div className="ns-kpi-label">Data engineering</div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">PySpark ETL, structured streaming, currency normalization, aggregation, and feature generation.</p>
                  </div>
                  <div className="border-b border-[var(--line)] p-6">
                    <div className="ns-kpi-label">Machine learning</div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">XGBoost, Prophet, and hybrid forecasting evaluated using chronological test data.</p>
                  </div>
                  <div className="border-b border-[var(--line)] p-6 sm:border-b-0 sm:border-r">
                    <div className="ns-kpi-label">Backend</div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">FastAPI endpoints expose sales summaries, forecasts, regional analytics, products, and model metrics.</p>
                  </div>
                  <div className="p-6">
                    <div className="ns-kpi-label">Visualization</div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">Dedicated web interface, Gradio manager UI, and Grafana operational dashboard.</p>
                  </div>
                </div>

                <div className="border-t border-[var(--line)] p-6">
                  <StatusLine label="API service" value="Connected" />
                  <StatusLine label="Forecasting artifacts" value="Available" />
                  <StatusLine label="Cloud storage" value="Connected" />
                  <StatusLine label="Analytics dashboard" value="Available" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/developers" className="ns-button-primary">
                  Meet the developers
                  <ArrowRight size={14} />
                </Link>
                <Link href="/system" className="ns-button-secondary">
                  View system status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-[var(--line)]">
        <div className="ns-container py-20 lg:py-24">
          <div className="ns-command-panel flex flex-col items-start justify-between gap-8 p-7 sm:p-9 lg:flex-row lg:items-center">
            <div>
              <div className="ns-eyebrow">NovaSales workspace</div>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
                Move from sales data to an operational forecast.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Open the live dashboard to inspect current performance, regional contribution, forecasts, and model evaluation.
              </p>
            </div>

            <Link href="/dashboard" className="ns-button-primary shrink-0">
              Open live dashboard
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ns-footer">
        <div className="ns-container flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="font-medium text-[var(--text-secondary)]">NovaSales</Link>
            <span className="mx-2">/</span>
            Sales Intelligence Platform
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/" className="ns-footer-link">Home</Link>
            <Link href="/dashboard" className="ns-footer-link">Dashboard</Link>
            <Link href="/developers" className="ns-footer-link">Developers</Link>
            <Link href="/terms" className="ns-footer-link">Terms</Link>
            <Link href="/privacy" className="ns-footer-link">Privacy</Link>
            <span className="ns-mono text-[10px] text-[var(--text-muted)]">v1.0</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
