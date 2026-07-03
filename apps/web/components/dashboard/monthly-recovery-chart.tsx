import type { MonthlyRecoverySeries } from "@fiscalcheck/shared-types";

/*
  Gráfico de recuperação mensal — barras "empilhadas" (recuperado
  destacado sobre o potencial em aberto). Renderizado inteiramente
  com CSS (sem lib de charts): mantém bundle enxuto e permite estilizar
  100% via tokens do Design System (aurora + neutros).

  Y-axis é implícita: o range das barras é normalizado por `maxValor`,
  o topo do gráfico corresponde ao maior "potencial" observado nos 12
  meses. Uma faixa fina destaca 100% do potencial (barra base) e uma
  barra sobreposta representa o recuperado no período.
*/

type Props = {
  data: MonthlyRecoverySeries;
};

const UNIDADE_LABEL: Record<MonthlyRecoverySeries["unidade"], string> = {
  reais: "R$",
  milhares: "R$ mil",
  milhoes: "R$ mi",
};

export function MonthlyRecoveryChart({ data }: Props) {
  const maxValor = data.pontos.reduce(
    (max, ponto) => Math.max(max, ponto.potencialBrl, ponto.recuperadoBrl),
    0,
  );

  return (
    <section
      aria-label="Recuperação mensal"
      className="rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]"
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-[17px] font-bold text-[#121826]">Recuperação mensal</h3>
          <p className="text-[12px] text-[#66718a]">
            declarado vs. recuperado · {UNIDADE_LABEL[data.unidade]}
          </p>
        </div>
      </header>

      <div className="flex h-48 items-end gap-2 pt-4">
        {data.pontos.map((ponto) => {
          const potPct = maxValor > 0 ? (ponto.potencialBrl / maxValor) * 100 : 0;
          const recPct = maxValor > 0 ? (ponto.recuperadoBrl / maxValor) * 100 : 0;
          return (
            <div
              key={ponto.competencia}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="relative flex w-full max-w-[28px] flex-col-reverse gap-[3px]">
                <div
                  className="w-full rounded-[3px] rounded-t-[5px] bg-[#e6eaf2]"
                  style={{ height: `${potPct * 1.5}px` }}
                  title={`Potencial: ${UNIDADE_LABEL[data.unidade]} ${ponto.potencialBrl.toLocaleString("pt-BR")}`}
                />
                <div
                  className="absolute bottom-0 w-full rounded-[3px] rounded-t-[5px] bg-[linear-gradient(180deg,#2d8fe0_0%,#1351b4_100%)] shadow-[0_0_0_1px_rgba(19,81,180,0.08)]"
                  style={{ height: `${recPct * 1.5}px` }}
                  title={`Recuperado: ${UNIDADE_LABEL[data.unidade]} ${ponto.recuperadoBrl.toLocaleString("pt-BR")}`}
                />
              </div>
              <span className="text-[10px] font-semibold text-[#8b97ac]">{ponto.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-[#f1f4f9] pt-4">
        <LegendChip color="linear-gradient(180deg,#2d8fe0,#1351b4)" label="Recuperado no período" />
        <LegendChip color="#e6eaf2" label="Potencial em aberto" />
      </div>
    </section>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[12px] font-semibold text-[#54607a]">
      <span
        aria-hidden="true"
        className="inline-block size-[11px] rounded-[3px]"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
