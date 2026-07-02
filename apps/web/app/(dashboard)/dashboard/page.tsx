import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel do auditor",
  description: "Fila priorizada por risco, casos e indicadores",
};

export default function DashboardPage() {
  return (
    <main className="container mx-auto space-y-6 p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Painel do auditor</h1>
        <p className="text-muted-foreground">Fila priorizada por risco e indicadores gerenciais.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Casos abertos</p>
          <p className="mt-2 text-3xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Valor potencial recuperável</p>
          <p className="mt-2 text-3xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Divergências críticas</p>
          <p className="mt-2 text-3xl font-semibold">—</p>
        </div>
      </section>
    </main>
  );
}
