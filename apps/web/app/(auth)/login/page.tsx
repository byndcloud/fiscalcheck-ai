import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Entrar",
	description: "Autenticação de auditor fiscal — FiscoCheck AI",
};

export default function LoginPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
					<p className="text-sm text-muted-foreground">
						Acesso restrito a auditores fiscais autorizados.
					</p>
				</div>
				<p className="text-center text-xs text-muted-foreground">
					Autenticação ainda não configurada nesta etapa do scaffold. MFA será
					exigido para todos os papéis privilegiados.
				</p>
			</div>
		</main>
	);
}
