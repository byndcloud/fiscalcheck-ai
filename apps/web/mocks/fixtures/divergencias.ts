import type { Divergencia, TipoDivergencia } from "@fiscalcheck/shared-types";

import { casosFixture } from "./casos";

/*
  Divergências do motor de cruzamento (T05 · módulo 2 · RF02).

  Duas camadas:
  1. Handcrafted — casos ricos usados em demos e testes, com o par
     `valorDeclarado × valorApurado` e evidências NFS-e nominais.
  2. Geradas — todo `divergenciaId` referenciado em `casosFixture` que
     não existe à mão é derivado deterministicamente do próprio caso
     (valores, competência, contribuinte), garantindo que o link
     divergência → dossiê nunca aponte para o vazio.

  Invariante: valorApurado − valorDeclarado = valor (diferença em R$).
  Todos os dados são sintéticos (AGENTS.md §1.2 — sigilo fiscal).
*/

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const handcrafted: Divergencia[] = [
  {
    id: "dv-001",
    contribuinteId: "ct-001",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 4,
    valor: 84_500.0,
    valorDeclarado: 120_500.0,
    valorApurado: 205_000.0,
    competencia: "2026-05",
    descricao:
      "Valor declarado no PGDAS (R$ 120.500,00) menor que a soma de NFS-e emitidas no período (R$ 205.000,00).",
    detectadoEm: "2026-07-01T09:15:00Z",
    evidencias: ["nf-1041", "nf-1042", "nf-1043"],
  },
  {
    id: "dv-002",
    contribuinteId: "ct-003",
    tipo: "regime_incorreto",
    origem: "cadastro",
    severidade: 5,
    valor: null,
    descricao:
      "Contribuinte no Simples Nacional cujo faturamento acumulado excedeu o teto anual em 2 competências.",
    detectadoEm: "2026-06-28T14:02:00Z",
    evidencias: ["arq-002"],
  },
  {
    id: "dv-003",
    contribuinteId: "ct-002",
    tipo: "omissao",
    origem: "declarado_vs_nfse",
    severidade: 3,
    valor: 12_300.0,
    valorDeclarado: 0,
    valorApurado: 12_300.0,
    competencia: "2026-06",
    descricao:
      "Duas NFS-e emitidas para tomadores no exterior sem declaração correspondente na apuração.",
    detectadoEm: "2026-07-02T08:50:00Z",
    evidencias: ["nf-2077", "nf-2081"],
  },
  {
    id: "dv-004",
    contribuinteId: "ct-005",
    tipo: "endereco_inconsistente",
    origem: "grafo_socios",
    severidade: 2,
    valor: null,
    descricao:
      "Endereço declarado coincide com o de outro contribuinte suspenso, mesmo bloco de sócios.",
    detectadoEm: "2026-06-30T11:20:00Z",
    evidencias: ["ct-004"],
  },
  {
    id: "dv-005",
    contribuinteId: "ct-001",
    tipo: "socio_vinculado",
    origem: "grafo_socios",
    severidade: 3,
    valor: null,
    descricao:
      "Sócio Ricardo T. também aparece em CT-004 (situação suspensa) com participação relevante.",
    detectadoEm: "2026-07-01T18:11:00Z",
    evidencias: ["ct-004"],
  },
  {
    id: "dv-006",
    contribuinteId: "ct-004",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 2,
    valor: 18_500.0,
    valorDeclarado: 24_700.0,
    valorApurado: 43_200.0,
    competencia: "2026-03",
    descricao:
      "ISS apurado sobre NFS-e do período (R$ 43.200,00) superior ao valor declarado e recolhido (R$ 24.700,00).",
    detectadoEm: "2026-06-10T10:05:00Z",
    evidencias: ["nf-3110", "nf-3112", "nf-3119"],
  },
  // Restaurante em fiscalização (cs-2026-0104)
  {
    id: "dv-007",
    contribuinteId: "ct-007",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 5,
    valor: 178_200.0,
    valorDeclarado: 291_800.0,
    valorApurado: 470_000.0,
    competencia: "2026-04",
    descricao:
      "Receita declarada (R$ 291.800,00) incompatível com NFS-e de eventos e DIMP de maquininhas no período (R$ 470.000,00).",
    detectadoEm: "2026-05-28T10:30:00Z",
    evidencias: ["nf-4021", "nf-4022"],
  },
  {
    id: "dv-008",
    contribuinteId: "ct-007",
    tipo: "omissao",
    origem: "declarado_vs_nfse",
    severidade: 4,
    valor: 87_200.0,
    valorDeclarado: 0,
    valorApurado: 87_200.0,
    competencia: "2026-05",
    descricao:
      "NFS-e de serviços de buffet emitidas em maio sem nenhuma declaração correspondente na apuração.",
    detectadoEm: "2026-05-29T15:45:00Z",
    evidencias: ["nf-4030", "nf-4031"],
  },
  // Imobiliária em fiscalização (cs-2026-0099)
  {
    id: "dv-028",
    contribuinteId: "ct-010",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 5,
    valor: 296_400.0,
    valorDeclarado: 512_300.0,
    valorApurado: 808_700.0,
    competencia: "2025-12",
    descricao:
      "Comissões declaradas (R$ 512.300,00) incompatíveis com NFS-e de intermediação e transações registradas em cartório (R$ 808.700,00).",
    detectadoEm: "2026-05-20T09:10:00Z",
    evidencias: ["nf-5102", "nf-5103"],
  },
  {
    id: "dv-029",
    contribuinteId: "ct-010",
    tipo: "socio_vinculado",
    origem: "grafo_socios",
    severidade: 3,
    valor: null,
    descricao:
      "Sócio Henrique F. integra outra intermediadora no mesmo endereço, com carteira de imóveis sobreposta.",
    detectadoEm: "2026-05-21T11:25:00Z",
    evidencias: ["ct-010"],
  },
  /*
    Cruzamento DIMP × declarado (RF 3.1.1 do TR — meios de pagamento).
    Evidência aponta para a carga DIMP do painel de ingestão (arq-002),
    fechando a cadeia fonte → cruzamento → caso.
  */
  {
    id: "dv-060",
    contribuinteId: "ct-020",
    tipo: "subdeclaracao",
    origem: "dimp_vs_declarado",
    severidade: 4,
    valor: 46_300.0,
    valorDeclarado: 22_100.0,
    valorApurado: 68_400.0,
    competencia: "2026-05",
    descricao:
      "Recebimentos em cartões informados pela DIMP (R$ 68.400,00) muito acima da receita declarada no PGDAS (R$ 22.100,00) — serviços de beleza com predominância de pagamento eletrônico.",
    detectadoEm: "2026-07-02T11:20:00Z",
    evidencias: ["arq-002"],
  },
  {
    id: "dv-061",
    contribuinteId: "ct-027",
    tipo: "omissao",
    origem: "dimp_vs_declarado",
    severidade: 3,
    valor: 36_400.0,
    valorDeclarado: 0,
    valorApurado: 36_400.0,
    competencia: "2026-05",
    descricao:
      "DIMP registra R$ 36.400,00 em mensalidades recebidas por cartão no período, sem nenhuma declaração correspondente na apuração do Simples.",
    detectadoEm: "2026-07-02T11:34:00Z",
    evidencias: ["arq-002"],
  },
  // Inativo com atividade (RF02 — filtro do edital)
  {
    id: "dv-052",
    contribuinteId: "ct-004",
    tipo: "inativo_atividade",
    origem: "cadastro",
    severidade: 4,
    valor: 43_200.0,
    valorDeclarado: 0,
    valorApurado: 43_200.0,
    competencia: "2026-03",
    descricao:
      "Cadastro mobiliário consta como suspenso desde 01/2026, porém há 3 NFS-e emitidas no trimestre (R$ 43.200,00) sem declaração.",
    detectadoEm: "2026-06-12T08:40:00Z",
    evidencias: ["nf-3110", "nf-3112", "nf-3119"],
  },
];

/* ── Camada gerada ──────────────────────────────────────────────────── */

const NON_MONETARY_TEMPLATES: readonly {
  tipo: TipoDivergencia;
  origem: Divergencia["origem"];
  descricao: string;
}[] = [
  {
    tipo: "socio_vinculado",
    origem: "grafo_socios",
    descricao:
      "Sócio com participação relevante também integra empresa com pendências fiscais no grafo societário.",
  },
  {
    tipo: "endereco_inconsistente",
    origem: "cadastro",
    descricao:
      "Endereço do cadastro mobiliário diverge do local de prestação informado nas NFS-e recentes.",
  },
  {
    tipo: "regime_incorreto",
    origem: "regime_incompativel",
    descricao:
      "Faturamento acumulado no exercício aponta enquadramento incompatível com o regime declarado.",
  },
];

function dvNumber(id: string): number {
  return Number.parseInt(id.replace(/\D/g, ""), 10) || 0;
}

/** "01/2025 a 05/2026" → "2026-05" (última competência do período). */
function competenciaFromPeriodo(periodo: string | null | undefined): string {
  const match = periodo?.match(/(\d{2})\/(\d{4})\s*$/);
  return match ? `${match[2]}-${match[1]}` : "2026-06";
}

function severidadeFromValor(valor: number): number {
  if (valor >= 150_000) return 5;
  if (valor >= 60_000) return 4;
  if (valor >= 25_000) return 3;
  return 2;
}

function round100(value: number): number {
  return Math.round(value / 100) * 100;
}

function generated(): Divergencia[] {
  const existing = new Set(handcrafted.map((d) => d.id));
  const result: Divergencia[] = [];

  for (const caso of casosFixture) {
    caso.divergenciaIds.forEach((dvId, index) => {
      if (existing.has(dvId)) return;
      existing.add(dvId);

      const num = dvNumber(dvId);
      const competencia = competenciaFromPeriodo(caso.periodoApuracao);

      // 1ª divergência do caso concentra o valor; extras são achados de grafo/cadastro.
      if (index === 0 && (caso.valorPotencial ?? 0) > 0) {
        const valor = round100(caso.valorPotencial ?? 0);
        const omissaoTotal = num % 3 === 0;
        const valorDeclarado = omissaoTotal ? 0 : round100(valor * (1.4 + (num % 4) * 0.35));
        const valorApurado = valorDeclarado + valor;
        result.push({
          id: dvId,
          contribuinteId: caso.contribuinteId,
          tipo: omissaoTotal ? "omissao" : "subdeclaracao",
          origem: "declarado_vs_nfse",
          severidade: severidadeFromValor(valor),
          valor,
          valorDeclarado,
          valorApurado,
          competencia,
          descricao: omissaoTotal
            ? `NFS-e emitidas no período (${BRL.format(valorApurado)}) sem declaração correspondente na apuração.`
            : `Valor declarado (${BRL.format(valorDeclarado)}) menor que a soma de NFS-e emitidas no período (${BRL.format(valorApurado)}).`,
          detectadoEm: caso.criadoEm,
          evidencias: [`nf-${num}a`, `nf-${num}b`],
        });
        return;
      }

      const template = NON_MONETARY_TEMPLATES[num % NON_MONETARY_TEMPLATES.length];
      if (!template) return;
      result.push({
        id: dvId,
        contribuinteId: caso.contribuinteId,
        tipo: template.tipo,
        origem: template.origem,
        severidade: 2 + (num % 2),
        valor: null,
        competencia,
        descricao: template.descricao,
        detectadoEm: caso.criadoEm,
        evidencias: [`arq-${String(num).padStart(3, "0")}`],
      });
    });
  }

  return result;
}

export const divergenciasFixture: Divergencia[] = [...handcrafted, ...generated()];
