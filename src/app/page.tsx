import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed w-full bg-[var(--header-bg)] backdrop-blur-sm z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-[var(--primary)]">DataRush</div>
          <div className="space-x-4">
            <Link href="/login" className="nav-link">Login</Link>
            <Link href="/contact" className="nav-link">Contáctanos</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient pt-24 pb-16">
        <div className="container mx-auto px-4 pt-16">
          <h1 className="text-5xl font-bold text-center mb-6">
            Bienvenido a DataRush
          </h1>
          <p className="text-xl text-center text-blue-100 max-w-3xl mx-auto">
            La solución más rápida y eficiente para el análisis de datos empresariales
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Análisis Avanzado",
              description: "Herramientas poderosas para el análisis de datos en tiempo real"
            },
            {
              title: "Visualización",
              description: "Gráficos interactivos y dashboards personalizables"
            },
            {
              title: "Integración",
              description: "Conexión perfecta con múltiples fuentes de datos"
            }
          ].map((feature, index) => (
            <div key={index} className="p-6 rounded-lg bg-blue-900/20 hover:bg-blue-900/30 transition-colors">
              <h3 className="text-xl font-bold mb-3 text-[var(--primary)]">{feature.title}</h3>
              <p className="text-blue-100">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
