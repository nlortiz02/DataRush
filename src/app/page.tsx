import Link from 'next/link';
import { FaArrowRight, FaBolt, FaChartLine, FaDatabase, FaLayerGroup } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';

const features = [
  {
    icon: FaChartLine,
    title: 'Análisis ágil',
    description: 'Convierte información operativa en decisiones claras con flujos más rápidos y visuales.',
  },
  {
    icon: FaDatabase,
    title: 'Datos organizados',
    description: 'Crea, administra y descarga plantillas desde una experiencia mucho más consistente.',
  },
  {
    icon: FaLayerGroup,
    title: 'Operación unificada',
    description: 'Centraliza importaciones, tickets y gestión interna en un entorno limpio y coherente.',
  },
];

export default function Home() {
  return (
    <div className="page-shell">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="text-xl font-semibold tracking-tight text-[var(--text)]">
            Data<span className="text-[var(--primary)]">Rush</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-soft)] transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text)]">
              Ingresar
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[var(--gradient-hero)] px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="fade-in">
              <span className="eyebrow">
                <FaBolt />
                Plataforma empresarial
              </span>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                Datos, operaciones y soporte en una experiencia más clara.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-soft)] md:text-lg">
                DataRush evoluciona hacia una interfaz premium, precisa y moderna para que cada flujo se sienta más rápido, más limpio y más confiable.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="premium-button">
                  Comenzar
                  <FaArrowRight />
                </Link>
                <a href="#capacidades" className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-center text-[var(--text-soft)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text)]">
                  Ver capacidades
                </a>
              </div>
            </div>

            <div className="glass-panel fade-in relative rounded-[32px] p-4 md:p-5">
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--bg-elevated)] p-4 md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Panel ejecutivo</span>
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs text-[var(--primary)]">
                    En vivo
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Importaciones', '24 activas'],
                    ['Plantillas', '128 listas'],
                    ['Tickets', '09 abiertos'],
                    ['Tiempo medio', '4.2 min'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 transition hover:-translate-y-1 hover:bg-[var(--surface)]">
                      <p className="text-sm text-[var(--text-muted)]">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="capacidades" className="px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl">
              <span className="eyebrow">Capacidades</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text)]">
                Diseñada para sentirse ligera, incluso cuando el trabajo no lo es.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="glass-panel rounded-[24px] p-6 transition hover:-translate-y-1">
                  <div className="mb-5 inline-flex rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
                    <Icon />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text)]">{title}</h3>
                  <p className="mt-3 leading-7 text-[var(--text-soft)]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
