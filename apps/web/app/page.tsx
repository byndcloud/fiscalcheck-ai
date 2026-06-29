export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
			<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
				FiscoCheck AI
			</h1>
			<p className="max-w-2xl text-lg text-muted-foreground">
				Plataforma de Inteligência Fiscal Agêntica — triagem 24/7 com decisão
				sempre do auditor humano.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
				<span className="rounded-full border px-3 py-1">
					Brusque / SC — Edital CPSI
				</span>
				<span className="rounded-full border px-3 py-1">Beyond / Aurora</span>
				<span className="rounded-full border px-3 py-1">
					Next.js 15 · FastAPI · LangGraph
				</span>
			</div>
			<a
				className="mt-4 text-sm underline underline-offset-4 hover:text-foreground"
				href="/dashboard"
			>
				Acessar painel do auditor →
			</a>
		</main>
	);
}
