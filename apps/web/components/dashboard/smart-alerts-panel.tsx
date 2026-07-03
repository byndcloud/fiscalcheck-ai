import type { Route } from "next";
import Link from "next/link";

import type { SmartAlert, SmartAlertKind } from "@fiscalcheck/shared-types";

/*
  Painel "Alertas inteligentes". Cada item é emitido por um agente da
  esteira (módulo 3) e traz uma tag semântica que herda cor do espectro
  de risco (crítico/rede/meta/info).
*/

const KIND_STYLES: Record<
  SmartAlertKind,
  { border: string; tagBg: string; tagText: string; wrapBg: string }
> = {
  critico: {
    border: "#c5160b",
    tagBg: "#fbe0dd",
    tagText: "#c5160b",
    wrapBg: "#fff8f7",
  },
  rede: {
    border: "#155bcb",
    tagBg: "#e6eefb",
    tagText: "#155bcb",
    wrapBg: "#f7faff",
  },
  meta: {
    border: "#168821",
    tagBg: "#e3f5e4",
    tagText: "#168821",
    wrapBg: "#f6fbf6",
  },
  info: {
    border: "#66718a",
    tagBg: "#e6eaf2",
    tagText: "#54607a",
    wrapBg: "#f8fafd",
  },
};

type Props = {
  alerts: readonly SmartAlert[];
};

export function SmartAlertsPanel({ alerts }: Props) {
  return (
    <section
      aria-label="Alertas inteligentes"
      className="rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]"
    >
      <header className="mb-4">
        <h3 className="font-display text-[17px] font-bold text-[#121826]">Alertas inteligentes</h3>
        <p className="text-[12px] text-[#66718a]">
          emitidos pela esteira de agentes nas últimas 24 h
        </p>
      </header>

      {alerts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#e1e6f0] px-4 py-6 text-center text-[13px] text-[#66718a]">
          Nenhum alerta ativo. A esteira continua monitorando em segundo plano.
        </p>
      ) : (
        <ul className="grid gap-3">
          {alerts.map((alerta) => (
            <AlertItem key={alerta.id} alerta={alerta} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AlertItem({ alerta }: { alerta: SmartAlert }) {
  const style = KIND_STYLES[alerta.tipo];

  const inner = (
    <div
      className="grid gap-1.5 rounded-lg border border-[#f1f4f9] px-4 py-3"
      style={{ borderLeft: `4px solid ${style.border}`, background: style.wrapBg }}
    >
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: style.tagBg, color: style.tagText }}
        >
          {alerta.tag}
        </span>
        <span className="ml-auto text-[11px] text-[#8b97ac]">
          {alerta.relativoAtual ?? new Date(alerta.emitidoEm).toLocaleString("pt-BR")}
        </span>
      </div>
      <p className="text-[13px] font-medium leading-snug text-[#333d52]">{alerta.mensagem}</p>
    </div>
  );

  if (alerta.linkHref) {
    return (
      <li>
        <Link
          href={alerta.linkHref as Route}
          className="block rounded-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b8def] hover:shadow-[0_2px_8px_rgba(16,24,40,0.06)]"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}
