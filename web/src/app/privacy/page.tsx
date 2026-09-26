import {
  ArrowLeft,
  ArrowRight,
  Database,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const sections = [
  {
    title: "1. Information handled by NovaSales",
    body: [
      "NovaSales processes structured sales information required for its analytics and forecasting workflows. This may include transaction dates, regions, countries, products, quantities, prices, currencies, discounts, campaigns, and derived sales metrics.",
      "The project dataset is used for development, testing, demonstration, data processing, forecasting, and visualization purposes.",
    ],
  },
  {
    title: "2. Data processing",
    body: [
      "Sales data may pass through PySpark ETL, feature-engineering, forecasting, API, dashboard, and visualization components.",
      "The platform may create derived datasets such as daily sales aggregates, regional summaries, product-level features, forecast predictions, and model evaluation metrics.",
    ],
  },
  {
    title: "3. Cloud storage",
    body: [
      "NovaSales uses Amazon S3 for project data storage and selected processed outputs.",
      "Access to the configured AWS resources is controlled through AWS IAM credentials and permissions. Public access controls are enabled on the configured S3 bucket.",
    ],
  },
  {
    title: "4. AI and Cohere",
    body: [
      "The AI explanation workflow may send structured sales and forecasting context to Cohere for natural-language explanation.",
      "The Cohere layer is designed to explain structured information. It does not replace or modify the numerical forecasting model.",
      "Sensitive credentials such as API keys should remain in server-side environment configuration and should not be exposed through the frontend.",
    ],
  },
  {
    title: "5. Application logs and technical information",
    body: [
      "During development and operation, technical information such as API responses, application errors, service status, model metadata, and infrastructure events may be recorded for debugging and validation.",
      "The exact information retained depends on the environment and services being used.",
    ],
  },
  {
    title: "6. Third-party services",
    body: [
      "NovaSales may interact with services including AWS, Cohere, Grafana, and software libraries used by the application.",
      "Those services may process information according to their own privacy practices, terms, security controls, and retention policies.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "The project uses controls such as environment variables for credentials, AWS IAM permissions, S3 public-access blocking, and server-side API configuration.",
      "No software system can guarantee absolute security. Users should avoid submitting information they are not authorized to process.",
    ],
  },
  {
    title: "8. Data retention",
    body: [
      "Retention of project data depends on the configured development environment, storage resources, application logs, and third-party services.",
      "NovaSales does not define a universal retention period for every integrated service.",
    ],
  },
];

export default function PrivacyPage() {
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

          <a href="/developers" className="ns-button-secondary">
            Developers
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      <div className="ns-container">
        <section className="border-b border-[var(--line)] py-14 sm:py-18 lg:py-24">
          <a
            href="/"
            className="ns-link inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]"
          >
            <ArrowLeft size={13} />
            Back to home
          </a>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.45fr] lg:items-end lg:gap-20">
            <div>
              <div className="ns-eyebrow">Legal / Privacy</div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                Privacy and data handling.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                How information moves through the NovaSales analytics,
                forecasting, AI, and infrastructure layers.
              </p>
            </div>

            <div className="ns-command-panel">
              <div className="ns-panel-header">
                <div className="flex items-center gap-3">
                  <LockKeyhole
                    size={15}
                    className="text-[var(--accent)]"
                  />

                  <span className="ns-panel-title">
                    Privacy status
                  </span>
                </div>

                <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--success)]">
                  Documented
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 text-[var(--success)]"
                  />

                  <div>
                    <div className="text-sm font-medium text-white">
                      Data handling overview
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                      Project-level information about storage, processing,
                      AI explanation, and infrastructure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] py-12 lg:py-18">
          <div className="grid gap-px bg-[var(--line)]">
            {sections.map((section) => (
              <article
                key={section.title}
                className="bg-[var(--surface)] p-7 sm:p-9 lg:p-10"
              >
                <h2 className="text-xl font-medium tracking-[-0.03em] text-white">
                  {section.title}
                </h2>

                <div className="mt-5 max-w-4xl space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-[var(--text-secondary)]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--line)] py-14 lg:py-20">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
            <div className="bg-[var(--surface)] p-7">
              <Database
                size={18}
                className="text-[var(--accent)]"
              />

              <h3 className="mt-6 text-lg font-medium text-white">
                Data processing
              </h3>

              <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                ETL, feature engineering, forecasting, and visualization
                transform structured sales information.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-7">
              <LockKeyhole
                size={18}
                className="text-[var(--accent)]"
              />

              <h3 className="mt-6 text-lg font-medium text-white">
                Credential protection
              </h3>

              <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                Application credentials are intended to remain in server-side
                environment configuration.
              </p>
            </div>

            <div className="bg-[var(--surface)] p-7">
              <ShieldCheck
                size={18}
                className="text-[var(--accent)]"
              />

              <h3 className="mt-6 text-lg font-medium text-white">
                Access control
              </h3>

              <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                AWS IAM and S3 access controls are used for the configured
                cloud resources.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <div className="ns-command-panel">
            <div className="p-7 sm:p-9">
              <div className="flex items-start gap-4">
                <FileText
                  size={18}
                  className="mt-0.5 text-[var(--accent)]"
                />

                <div>
                  <div className="text-lg font-medium text-white">
                    Project-level privacy notice
                  </div>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                    NovaSales is an engineering and demonstration platform.
                    This page documents the intended handling of information
                    within the project and should not be interpreted as a
                    substitute for the privacy policy of any integrated
                    third-party service.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/terms" className="ns-button-secondary">
                  Terms of use
                  <ArrowRight size={13} />
                </a>

                <a href="/system" className="ns-button-secondary">
                  System architecture
                  <ArrowRight size={13} />
                </a>

                <a href="/developers" className="ns-button-primary">
                  Developers
                  <ArrowRight size={13} />
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
              Sales Intelligence Platform
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="/" className="ns-footer-link">
              Home
            </a>

            <a href="/terms" className="ns-footer-link">
              Terms
            </a>

            <a href="/privacy" className="ns-footer-link">
              Privacy
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