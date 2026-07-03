import { LockIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/*
  Banner de sigilo (T19 · micro-padrão do módulo 6).

  Reforça visualmente o compromisso do ambiente: todo dado exibido está
  sob sigilo fiscal (art. 198 CTN + LGPD) e toda visualização é
  registrada na trilha imutável. Colocado no topo de cada tela de
  Governança para lembrar o Admin/Supervisor antes de qualquer clique.
*/

export function SigiloBanner({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Aviso de sigilo fiscal"
      className={cn(
        "flex items-start gap-3 rounded-[var(--r-md)] border border-[color:var(--c-warning)]/50 bg-[color:var(--c-warning)]/10 p-3 text-[13px] text-text-strong",
        className,
      )}
    >
      <LockIcon aria-hidden="true" className="mt-0.5 size-4 text-[color:var(--c-warning)]" />
      <p className="leading-snug">
        <strong className="font-semibold">Ambiente sob sigilo fiscal (art. 198 CTN + LGPD).</strong>{" "}
        Todo acesso a este painel é registrado na trilha de auditoria imutável. Dados de
        contribuintes aparecem mascarados por padrão; revelar valores é uma ação auditada.
      </p>
    </div>
  );
}
