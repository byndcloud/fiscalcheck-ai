import type {
  CaseDecision,
  CaseDocument,
  Caso,
  Contribuinte,
  Divergencia,
  NFSe,
  Score,
} from "@fiscalcheck/shared-types";

/*
  Agregado imutável que alimenta o PDF do dossiê (T28 · módulo 4).

  Passamos UM único objeto para o `<DossiePdfDocument>` — o componente
  React-PDF é puro (sem hooks/fetch), o que garante que o mesmo input
  sempre gera o mesmo PDF (essencial para reproduzibilidade da peça
  processual e para os smoke tests futuros).
*/

export type DossieTimelineEntry =
  | {
      kind: "decision";
      timestamp: string;
      titulo: string;
      subtitulo: string;
      atorNome: string;
      atorPapel: string;
      correlationId: string;
      justificativa?: string;
    }
  | {
      kind: "document";
      timestamp: string;
      titulo: string;
      subtitulo: string;
      atorNome: string;
      atorPapel: string;
      correlationId: string;
    };

export type DossieAuditor = {
  displayName: string;
  role: string;
};

export type DossieData = {
  emittedAt: string;
  correlationId: string;
  /*
    Número da peça processual (PEC-<ano>-<seq>). Derivado de forma
    determinística do id do caso + ano de emissão para permanecer
    estável entre exportações — ainda que a assinatura oficial (com
    protocolo real) fique a cargo do sistema de processo eletrônico
    da Prefeitura, o número acima segue a peça em toda a auditoria.
  */
  numeroPeca: string;
  auditor: DossieAuditor;
  caso: Caso;
  contribuinte: Contribuinte | null;
  score: Score | null;
  divergencias: Divergencia[];
  evidencias: NFSe[];
  decisions: CaseDecision[];
  documents: CaseDocument[];
  timeline: DossieTimelineEntry[];
  valores: {
    somaDivergencias: number;
    potencial: number | null;
  };
};

export type BuildDossieDataInput = {
  caso: Caso;
  contribuinte: Contribuinte | null;
  score: Score | null;
  divergencias: Divergencia[];
  evidencias: NFSe[];
  decisions: CaseDecision[];
  documents: CaseDocument[];
  auditor: DossieAuditor;
  correlationId: string;
  now?: Date;
};

const ROLE_LABEL: Record<string, string> = {
  auditor: "Auditor Fiscal",
  supervisor: "Gestor Supervisor",
  admin: "Administrador",
  cidadao: "Contribuinte",
  agente_sistema: "Agente do sistema",
};

const DOC_KIND_LABEL: Record<CaseDocument["kind"], string> = {
  termo_intimacao: "Termo de Intimação",
  termo_inicio_fiscalizacao: "Termo de Início de Fiscalização",
};

const DECISION_ACTION_LABEL: Record<CaseDecision["action"], string> = {
  aprovar: "Decisão: Aprovada",
  ajustar: "Decisão: Ajuste solicitado",
  rejeitar: "Decisão: Rejeitada",
};

export function roleToLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

/*
  Deriva o número da peça processual a partir do id do caso e do ano
  de emissão. Determinístico (mesmo caso → mesmo número num dado ano)
  e livre de dependências externas — o protocolo real fica com o
  sistema de processo eletrônico da Prefeitura, este número serve de
  referência interna do FiscalCheck AI para localizar a peça.

  Formato: PEC-<ano>-<sequencial 6 dígitos>
  Sequencial: hash simples djb2 dos caracteres do id do caso, módulo
  1.000.000. Garante distribuição razoável sem colisões prováveis no
  volume de casos previsto para o MVP.
*/
export function derivePecaProcessualNumber(casoId: string, emittedAt: Date): string {
  const ano = emittedAt.getFullYear();
  let hash = 5381;
  for (let i = 0; i < casoId.length; i++) {
    hash = (hash * 33) ^ casoId.charCodeAt(i);
  }
  const seq = Math.abs(hash) % 1_000_000;
  return `PEC-${ano}-${seq.toString().padStart(6, "0")}`;
}

function buildTimeline(
  decisions: CaseDecision[],
  documents: CaseDocument[],
): DossieTimelineEntry[] {
  const decisionEntries: DossieTimelineEntry[] = decisions.map((d) => ({
    kind: "decision",
    timestamp: d.timestamp,
    titulo: DECISION_ACTION_LABEL[d.action],
    subtitulo: `${d.statusAnterior} → ${d.statusPosterior}`,
    atorNome: d.atorNome,
    atorPapel: roleToLabel(d.atorPapel),
    correlationId: d.correlationId,
    justificativa: d.justificativa,
  }));

  const documentEntries: DossieTimelineEntry[] = documents.map((doc) => ({
    kind: "document",
    timestamp: doc.emitidoEm,
    titulo: `${DOC_KIND_LABEL[doc.kind]} ${doc.numero}`,
    subtitulo: "Termo processual emitido e anexado ao caso.",
    atorNome: doc.emitidoPor,
    atorPapel: "Sistema",
    /*
      CaseDocument não carrega correlationId próprio no schema atual;
      derivamos uma referência estável a partir do ID do documento
      para o PDF ainda ser rastreável.
    */
    correlationId: doc.id,
  }));

  return [...decisionEntries, ...documentEntries].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );
}

/*
  Função pura — mesmo input gera mesmo PDF byte-a-byte. Não faz IO,
  não muta os arrays de entrada. Toda a lógica de "montagem" da peça
  processual mora aqui, isolada do componente React-PDF.
*/
export function buildDossieData(input: BuildDossieDataInput): DossieData {
  const now = input.now ?? new Date();

  const divergenciasFiltradas = input.divergencias.filter((d) =>
    input.caso.divergenciaIds.includes(d.id),
  );

  const evidenciaIds = new Set<string>(divergenciasFiltradas.flatMap((d) => d.evidencias ?? []));
  const evidenciasFiltradas = input.evidencias.filter((n) => evidenciaIds.has(n.id));

  const somaDivergencias = divergenciasFiltradas.reduce(
    (acc, d) => acc + (typeof d.valor === "number" ? d.valor : 0),
    0,
  );

  return {
    emittedAt: now.toISOString(),
    correlationId: input.correlationId,
    numeroPeca: derivePecaProcessualNumber(input.caso.id, now),
    auditor: input.auditor,
    caso: input.caso,
    contribuinte: input.contribuinte,
    score: input.score,
    divergencias: divergenciasFiltradas,
    evidencias: evidenciasFiltradas,
    decisions: input.decisions,
    documents: input.documents,
    timeline: buildTimeline(input.decisions, input.documents),
    valores: {
      somaDivergencias,
      potencial: input.caso.valorPotencial ?? null,
    },
  };
}
