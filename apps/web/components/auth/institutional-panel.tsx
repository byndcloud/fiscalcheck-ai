import { DatabaseIcon, type LucideIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";

/*
  Painel institucional (lado esquerdo do split-screen). Mostra o
  título hero da plataforma, uma breve descrição e três bullets de
  valor. A marca é exibida no lado direito, dentro do LoginForm.
  Sem interação — não precisa de "use client".
*/

type Bullet = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const BULLETS: readonly Bullet[] = [
  {
    icon: DatabaseIcon,
    title: "Ingestão multifonte auditável",
    description:
      "NFS-e, DIMP, ECD, DEFIS, PGDAS e cadastro mobiliário reunidos com cadeia de custódia.",
  },
  {
    icon: SparklesIcon,
    title: "IA que assessora, nunca decide",
    description: "Score de risco e recomendações XAI — o auditor sempre tem a palavra final.",
  },
  {
    icon: ShieldCheckIcon,
    title: "LGPD e sigilo fiscal por padrão",
    description: "Pseudonimização, RBAC + MFA e logs imutáveis desde o primeiro clique.",
  },
];

function BenefitBullet({ icon: Icon, title, description }: Bullet) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="mt-1 grid size-9 shrink-0 place-items-center rounded-md bg-white/10 text-white ring-1 ring-inset ring-white/15"
      >
        <Icon className="size-4" />
      </span>
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs leading-relaxed text-white/75">{description}</p>
      </div>
    </li>
  );
}

export function InstitutionalPanel() {
  return (
    <section
      aria-label="FiscalCheck AI"
      data-slot="institutional-panel"
      className="relative flex h-full flex-col justify-center overflow-hidden bg-[image:var(--grad-aurora)] px-8 py-10 text-white lg:px-12 lg:py-14"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 size-96 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-black/20 blur-3xl"
      />

      <div className="relative grid gap-6">
        <div className="grid gap-3">
          <h1 className="font-display text-3xl font-semibold leading-tight lg:text-4xl">
            Triagem fiscal agêntica,
            <br />
            defensável e humana.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/85">
            Uma plataforma que consolida bases, aponta divergências e sugere a próxima ação —
            mantendo o auditor sempre no comando.
          </p>
        </div>

        <ul className="grid gap-4">
          {BULLETS.map((bullet) => (
            <BenefitBullet key={bullet.title} {...bullet} />
          ))}
        </ul>
      </div>

      <footer className="relative mt-16 text-[11px] text-white/70">
        © {new Date().getFullYear()} Prefeitura Municipal de Brusque · Uso restrito.
      </footer>
    </section>
  );
}
