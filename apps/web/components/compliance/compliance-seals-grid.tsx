import type { ComplianceSeal } from "@fiscalcheck/shared-types";

import { ComplianceSealCard } from "@/components/compliance/compliance-seal-card";

/*
  Grid dos 9 selos de conformidade (T19 · módulo 6).

  Ordem: recebida do fixture (definida centralmente). Layout responsivo
  1 → 2 → 3 colunas conforme viewport, mantendo o card com altura
  natural (sem `h-full` para permitir textos maiores em selos mais
  detalhados).
*/

export function ComplianceSealsGrid({ seals }: { seals: readonly ComplianceSeal[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {seals.map((seal) => (
        <ComplianceSealCard key={seal.code} seal={seal} />
      ))}
    </div>
  );
}
