import type { NivelRisco, RiskDistribution } from "@fiscalcheck/shared-types";

/*
  Painel "Distribuição por nível de risco".

  Reproduz o padrão do dashboard de referência: uma barra empilhada
  horizontal (5 segmentos, cores do espectro de risco do DS) seguida
  de um grid de 5 chips com dot + label + contagem.

  As cores usadas aqui espelham exatamente os tokens --c-risk-1..5
  definidos em globals.css.
*/

const RISK_COLORS: Record<NivelRisco, string> = {
  conforme: "#168821",
  baixo: "#7fb23c",
  medio: "#f2a900",
  alto: "#e8590c",
  critico: "#c5160b",
};

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

type Props = {
  data: RiskDistribution;
};

export function RiskDistributionPanel({ data }: Props) {
  return (
    <section
      aria-label="Distribuição por nível de risco"
      className="rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]"
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[17px] font-bold text-[#121826]">
          Distribuição por nível de risco
        </h3>
        <p className="text-[12px] text-[#66718a]">
          {NUM.format(data.totalPontuados)} contribuintes pontuados
        </p>
      </header>

      <div
        className="mb-4 flex h-4 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={`Distribuição: ${data.entradas
          .map((e) => `${e.label} ${e.percentual.toFixed(1)}%`)
          .join(", ")}`}
      >
        {data.entradas.map((entrada) => (
          <div
            key={entrada.nivel}
            style={{
              width: `${entrada.percentual}%`,
              background: RISK_COLORS[entrada.nivel],
            }}
            title={`${entrada.label} — ${entrada.percentual.toFixed(1)}%`}
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
        {data.entradas.map((entrada) => (
          <li key={entrada.nivel} className="rounded-lg border border-[#f1f4f9] px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block size-[9px] shrink-0 rounded-full"
                style={{ background: RISK_COLORS[entrada.nivel] }}
              />
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#54607a]">
                {entrada.label}
              </span>
            </div>
            <p className="font-data text-[18px] font-semibold text-[#121826]">
              {NUM.format(entrada.contagem)}
            </p>
            <p className="text-[10px] text-[#8b97ac]">{entrada.percentual.toFixed(1)}%</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
