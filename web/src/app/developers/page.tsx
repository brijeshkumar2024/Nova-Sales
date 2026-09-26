"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  LineChart,
  Radio,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const architecture = [
  {
    number: "01",
    title: "Sales sources",
    description:
      "Historical and continuously arriving regional sales transactions across products, currencies, and markets.",
    icon: Database,
  },
  {
    number: "02",
    title: "PySpark processing",
    description:
      "Cleaning, validation, currency normalization, daily and weekly aggregation, and feature generation.",
    icon: Server,
  },
  {
    number: "03",
    title: "Forecasting",
    description:
      "XGBoost, Prophet, and hybrid forecasting evaluated chronologically on held-out historical observations.",
    icon: LineChart,
  },
  {
    number: "04",
    title: "FastAPI",
    description:
      "A unified operational API serving summaries, history, forecasts, regional analytics, products, and model metrics.",
    icon: Radio,
  },
  {
    number: "05",
    title: "Cohere intelligence",
    description:
      "Structured natural-language explanations generated from forecast outputs and supporting business metrics.",
    icon: BrainCircuit,
  },
  {
    number: "06",
    title: "Business interfaces",
    description:
      "Premium web frontend, Gradio manager interface, and Grafana operational dashboard.",
    icon: BarChart3,
  },
];

const technologies = [
  ["Frontend", "Next.js · TypeScript · Tailwind CSS"],
  ["Data engineering", "PySpark · Pandas · Structured Streaming"],
  ["Machine learning", "XGBoost · Prophet · Hybrid forecasting"],
  ["Backend", "FastAPI · REST API"],
  ["GenAI", "Cohere API · structured explanations"],
  ["Cloud", "AWS S3 · IAM · CloudWatch evaluation"],
  ["BI", "Grafana"],
  ["Manager UI", "Gradio"],
];

const apiRoutes = [
  "GET /health",
  "GET /sales/summary",
  "GET /sales/history",
  "GET /forecast",
  "GET /forecast/future",
  "GET /forecast/latest",
  "GET /metrics",
  "GET /sales/regions",
  "GET /sales/products/top",
  "GET /api/info",
];

const projectStats = [
  ["100K", "historical transactions"],
  ["912", "daily observations"],
  ["5", "active regions"],
  ["27", "active products"],
  ["7 days", "forecast horizon"],
  ["3", "forecasting approaches"],
];

function Status({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--success)]">
      <span className="ns-status-dot" />
      {children}
    </span>
  );
}

export default function DevelopersPage() {
  return (
    <main className="ns-page">
      <header className="ns-header">
        <div className="ns-container ns-header-inner">
          <a href="/" className="ns-brand" aria-label="NovaSales home">
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

          <a href="/dashboard" className="ns-button-secondary">
            Open dashboard
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      <div className="ns-container">
        {/* INTRO */}
        <section className="border-b border-[var(--line)] py-14 sm:py-18 lg:py-24">
          <a
            href="/"
            className="ns-link inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]"
          >
            <ArrowLeft size={13} />
            Back to NovaSales
          </a>

          <div className="mt-12 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
            <div>
              <div className="ns-eyebrow">Developers / Engineering</div>

              <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                The people and engineering behind NovaSales.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                NovaSales is an end-to-end sales intelligence project covering
                data engineering, time-series forecasting, backend services,
                cloud storage, generative AI, and business visualization.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/dashboard" className="ns-button-primary">
                  Open live dashboard
                  <ArrowRight size={15} />
                </a>

                <a href="/system" className="ns-button-secondary">
                  Inspect system
                  <Server size={15} />
                </a>
              </div>
            </div>

            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 bg-[var(--success)]" />
                  <span className="ns-panel-title">Project state</span>
                </div>
                <Status>Operational</Status>
              </div>

              <div className="grid grid-cols-2">
                {projectStats.map(([value, label], index) => (
                  <div
                    key={label}
                    className={`border-b border-[var(--line)] p-5 ${
                      index % 2 === 0 ? "border-r" : ""
                    }`}
                  >
                    <div className="text-2xl font-medium tracking-[-0.04em] text-white">
                      {value}
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DEVELOPER */}
        <section className="border-b border-[var(--line)] py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Developer</div>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">
                Brijesh Kumar Mohanty
              </h2>

              <p className="mt-4 text-sm uppercase tracking-[0.1em] text-[var(--accent)]">
                Full-Stack · AI/ML · Data Engineering
              </p>

              <p className="mt-6 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                Developer responsible for the NovaSales application across
                data processing, forecasting, backend APIs, AI explanation,
                cloud integration, and business-facing interfaces.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://github.com/brijeshkumar2024"
                  target="_blank"
                  rel="noreferrer"
                  className="ns-button-secondary"
                >
                  <GitBranch size={15} />
                  GitHub
                  <ExternalLink size={12} />
                </a>

                <a
                  href="https://www.linkedin.com/in/brijesh-kumar-mohanty"
                  target="_blank"
                  rel="noreferrer"
                  className="ns-button-secondary"
                >
                  <ExternalLink size={15} />
                  LinkedIn
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              <div className="border-b border-[var(--line)] px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="ns-panel-title">Engineering scope</span>
                  <Code2 size={16} className="text-[var(--text-muted)]" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2">
                {[
                  [
                    "Data engineering",
                    "ETL, cleaning, currency normalization, aggregation, features, and structured streaming.",
                  ],
                  [
                    "Forecasting",
                    "XGBoost, Prophet, hybrid comparison, chronological validation, and future forecasting.",
                  ],
                  [
                    "Backend",
                    "FastAPI service layer with operational sales, forecast, regional, product, and metrics endpoints.",
                  ],
                  [
                    "AI & interfaces",
                    "Cohere explanations, Gradio manager UI, premium web frontend, and Grafana dashboard.",
                  ],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="border-b border-[var(--line)] p-6 even:sm:border-l last:border-b-0"
                  >
                    <div className="ns-kpi-label">{title}</div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="border-b border-[var(--line)] py-20 lg:py-24">
          <div>
            <div className="ns-eyebrow">System architecture</div>

            <h2 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              From transaction to decision.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              The platform separates ingestion, transformation, forecasting,
              explanation, API delivery, and visualization so every stage can
              be inspected independently.
            </p>
          </div>

          <div className="mt-12 grid border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {architecture.map((layer) => {
              const Icon = layer.icon;

              return (
                <article key={layer.number} className="ns-architecture-node">
                  <div className="flex items-center justify-between">
                    <span className="ns-node-number">{layer.number}</span>
                    <Icon
                      size={17}
                      strokeWidth={1.4}
                      className="text-[var(--text-muted)]"
                    />
                  </div>

                  <h3 className="ns-node-title">{layer.title}</h3>

                  <p className="ns-node-description">{layer.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex gap-3 border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <ShieldCheck
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-[var(--accent)]"
            />
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              AWS S3 is the cloud storage layer. Continuous ingestion and
              processing was validated using local PySpark Structured
              Streaming with simulated arriving batches. Managed Kinesis was
              retained as the intended ingestion layer but was not deployed
              because of account-level service access limitations.
            </p>
          </div>
        </section>

        {/* TECH STACK */}
        <section className="border-b border-[var(--line)] py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Technology stack</div>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">
                Built across the complete data-to-decision path.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                Each technology has a defined role in the working platform.
              </p>
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              {technologies.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-3 border-b border-[var(--line)] px-6 py-5 last:border-b-0 sm:grid-cols-[180px_1fr]"
                >
                  <div className="ns-kpi-label">{label}</div>
                  <div className="text-sm text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FORECASTING */}
        <section className="border-b border-[var(--line)] py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">Forecasting</div>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">
                Models are evaluated, not assumed.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                NovaSales uses chronological train/test evaluation across
                XGBoost, Prophet, and a hybrid approach. The application
                exposes the resulting metrics directly to the interface.
              </p>

              <a
                href="/forecast"
                className="ns-button-secondary mt-8 inline-flex"
              >
                Open Forecast Studio
                <ArrowRight size={14} />
              </a>
            </div>

            <div className="grid border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
              {[
                ["XGBoost", "₹24.5M", "MAE", "21.9%", "MAPE"],
                ["Hybrid", "₹24.4M", "MAE", "21.3%", "MAPE"],
                ["Prophet", "₹26.9M", "MAE", "22.8%", "MAPE"],
              ].map(([model, first, firstLabel, second, secondLabel]) => (
                <div key={model} className="bg-[var(--surface)] p-6">
                  <div className="ns-kpi-label">{model}</div>

                  <div className="mt-7">
                    <div className="text-2xl font-medium tracking-[-0.04em] text-white">
                      {first}
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {firstLabel}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[var(--line)] pt-5">
                    <div className="text-xl font-medium text-white">
                      {second}
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {secondLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API */}
        <section className="border-b border-[var(--line)] py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <div>
              <div className="ns-eyebrow">API surface</div>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">
                One operational service layer.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                FastAPI exposes the structured outputs consumed by the NovaSales
                interfaces and monitoring layer.
              </p>

              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="ns-button-secondary mt-8 inline-flex"
              >
                Open API documentation
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="border border-[var(--line)] bg-[var(--surface)]">
              <div className="border-b border-[var(--line)] px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="ns-panel-title">Available endpoints</span>
                  <span className="ns-mono text-[9px] text-[var(--success)]">
                    FASTAPI
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2">
                {apiRoutes.map((route) => (
                  <div
                    key={route}
                    className="border-b border-[var(--line)] px-6 py-4 last:border-b-0 sm:odd:border-r"
                  >
                    <code className="text-[11px] text-[var(--text-secondary)]">
                      {route}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TOOLING */}
        <section className="border-b border-[var(--line)] py-20 lg:py-24">
          <div className="ns-command-panel">
            <div className="ns-panel-header">
              <div className="flex items-center gap-3">
                <Terminal size={15} className="text-[var(--accent)]" />
                <span className="ns-panel-title">Application surfaces</span>
              </div>
              <span className="ns-mono text-[9px] text-[var(--text-muted)]">
                NOVASALES
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Web platform",
                  "Premium Next.js interface for executive sales intelligence.",
                  "/dashboard",
                  "Open dashboard",
                ],
                [
                  "Forecast Studio",
                  "Dedicated forward-looking forecasting workspace.",
                  "/forecast",
                  "Open forecast",
                ],
                [
                  "Analytics",
                  "Regional and product performance analysis.",
                  "/analytics",
                  "Open analytics",
                ],
                [
                  "AI Insights",
                  "Structured Cohere explanations around forecast outputs.",
                  "/ai-insights",
                  "Open AI insights",
                ],
              ].map(([title, description, href, label]) => (
                <div
                  key={title}
                  className="border-b border-[var(--line)] p-6 lg:border-b-0 lg:border-r last:lg:border-r-0"
                >
                  <div className="ns-kpi-label">{title}</div>
                  <p className="mt-4 min-h-[72px] text-xs leading-6 text-[var(--text-muted)]">
                    {description}
                  </p>

                  <a
                    href={href}
                    className="ns-link mt-5 inline-flex items-center gap-2 text-[11px]"
                  >
                    {label}
                    <ArrowRight size={12} />
                  </a>
                </div>
              ))}
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
              Sales Intelligence Platform
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
            <a href="/terms" className="ns-footer-link">
              Terms
            </a>
            <a href="/privacy" className="ns-footer-link">
              Privacy
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/brijeshkumar2024"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="ns-footer-link"
            >
              <GitBranch size={15} />
            </a>

            <a
              href="https://www.linkedin.com/in/brijesh-kumar-mohanty"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="ns-footer-link"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
