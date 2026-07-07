import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  AgendamentoRequestSchema,
  AgenteSchema,
  AnnotationRequestSchema,
  type AtypicalAccess,
  AtypicalAccessSchema,
  type AuditLogEntry,
  AuditLogEntrySchema,
  AuditableActionSchema,
  BlockAtypicalRequestSchema,
  type CaseAnnotation,
  CaseAnnotationSchema,
  type CaseDecision,
  CaseDecisionSchema,
  type CaseDocument,
  CaseDocumentSchema,
  type Caso,
  CasoSchema,
  CitizenActionResponseSchema,
  type CitizenInteracao,
  CitizenInteracaoSchema,
  type CitizenInteracaoTipo,
  CitizenRegistrationSchema,
  CitizenRegistrationUpdateRequestSchema,
  ComplianceSealSchema,
  ComunicacaoSchema,
  ContestacaoRequestSchema,
  Contribuinte360Schema,
  ContribuinteSchema,
  CopilotAskRequestSchema,
  CopilotAskResponseSchema,
  CtcFeedSchema,
  DecisionRequestSchema,
  type DevolutivaPreTriagem,
  DevolutivaTratamentoRequestSchema,
  DivergenciaSchema,
  DossieExportRequestSchema,
  DossieExportResponseSchema,
  type GeoObra,
  GeoObraSchema,
  type GuiaDam,
  type MetaPiloto,
  MetaPilotoSchema,
  MonthlyRecoverySeriesSchema,
  NFSeSchema,
  NetworkScenarioSchema,
  type NonFiler,
  NonFilerSchema,
  type Notificacao,
  NotificacaoSchema,
  PanelKpisSchema,
  PanelManagerKpisSchema,
  PanelManagerPeriodoSchema,
  ParcelamentoAdesaoRequestSchema,
  PreferencesUpdateRequestSchema,
  RelatorioGerencialRequestSchema,
  RelatorioGerencialResponseSchema,
  RiskDistributionSchema,
  type RiskModelChange,
  RiskModelChangeSchema,
  type RiskModelConfig,
  RiskModelConfigSchema,
  RiskModelPublishRequestSchema,
  RiskModelPublishResponseSchema,
  type RiskQueueItem,
  RiskQueueItemSchema,
  type Role,
  RoleSchema,
  ScoreSchema,
  type SearchResult,
  SearchResultSchema,
  SmartAlertSchema,
  type SusAvaliacao,
  SusAvaliacaoSchema,
  SusSubmitRequestSchema,
  SusSubmitResponseSchema,
  type SystemUser,
  SystemUserSchema,
  TrainingAttemptRequestSchema,
  type TrainingAttemptResult,
  TrainingAttemptResultSchema,
  TrainingCaseSchema,
  UserCreateRequestSchema,
  type UserPreferences,
  UserProfileSchema,
  UserUpdateRequestSchema,
} from "@fiscalcheck/shared-types";

import { refreshMeta } from "@/lib/analytics/meta-status";
import { computeSusMedia, computeSusScore } from "@/lib/analytics/sus";
import { nextStatus, shouldEmitDocument } from "@/lib/case-transitions";
import { simulateParcelamento } from "@/lib/citizen/parcelamento";

import { agentesFixture } from "./fixtures/agentes";
import { ArquivoIngeridoSchema, arquivosFixture } from "./fixtures/arquivos";
import { atypicalAccessesFixture } from "./fixtures/atypical-accesses";
import { auditLogFixture } from "./fixtures/audit-log";
import { auditLogExtendedFixture } from "./fixtures/audit-log-extended";
import { caseDecisionsFixture } from "./fixtures/case-decisions";
import { caseDocumentsFixture } from "./fixtures/case-documents";
import { casosFixture } from "./fixtures/casos";
import { complianceSealsFixture } from "./fixtures/compliance-seals";
import { comunicacoesFixture } from "./fixtures/comunicacoes";
import {
  declaracoesFixture,
  dividaAtivaFixture,
  pagamentosFixture,
  scoreHistoricoFixture,
  valorPotencialEstimadoFixture,
} from "./fixtures/contribuinte-360";
import { contribuintesFixture } from "./fixtures/contribuintes";
import {
  COPILOT_FALLBACK_RESPOSTA,
  COPILOT_SUGESTOES_PADRAO,
  copilotScriptsFixture,
} from "./fixtures/copilot-scripts";
import { findCtcAlert, getCtcFeed } from "./fixtures/ctc-feed";
import { divergenciasFixture } from "./fixtures/divergencias";
import { geoObrasFixture } from "./fixtures/geo-obras";
import { KPIsAnalyticsSchema, kpisFixture } from "./fixtures/kpis";
import { metasPilotoFixture } from "./fixtures/metas-piloto";
import { monthlyRecoveryFixture } from "./fixtures/monthly-recovery";
import { networkScenariosFixture } from "./fixtures/network-scenarios";
import { nfseFixture } from "./fixtures/nfse";
import { nonFilersFixture } from "./fixtures/non-filers";
import { notificacoesFixture } from "./fixtures/notificacoes";
import { panelKpisFixture } from "./fixtures/panel-kpis";
import { buildPanelManagerKpisFixture } from "./fixtures/panel-manager-kpis";
import { riskDistributionFixture } from "./fixtures/risk-distribution";
import { riskModelConfigFixture, riskModelHistoryFixture } from "./fixtures/risk-model";
import { scoresFixture } from "./fixtures/scores";
import { smartAlertsFixture } from "./fixtures/smart-alerts";
import { susAvaliacoesFixture } from "./fixtures/sus-avaliacoes";
import { systemUsersFixture } from "./fixtures/system-users";
import { trainingCasesFixture } from "./fixtures/training-cases";
import { userProfilesFixture } from "./fixtures/user-profiles";

/*
  Handlers MSW — 1 endpoint por módulo funcional.
  Cada handler valida a saída contra um schema Zod antes de responder:
  isso protege o front do drift entre fixtures e contratos.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const notificacoesMutable = [...notificacoesFixture];

/*
  Preferências de interface por papel (T27 · Transversal).
  Persistidas na camada de serviço fake enquanto a sessão do worker
  viver — mesmo padrão dos demais estados in-memory deste arquivo.
*/
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  tamanhoFonte: "padrao",
  densidade: "confortavel",
  notificacoesAtivas: true,
};
const userPreferencesByRole = new Map<Role, UserPreferences>();

function getPreferencesForRole(role: Role): UserPreferences {
  return userPreferencesByRole.get(role) ?? { ...DEFAULT_USER_PREFERENCES };
}

/*
  Cadastro do cidadão é editável (contato/endereço) — clone mutável da
  fixture para o PUT /me/registration persistir na sessão do worker.
*/
const citizenRegistrationMutable = userProfilesFixture.cidadao.dadosCadastrais
  ? { ...userProfilesFixture.cidadao.dadosCadastrais }
  : undefined;

/*
  Tentativas do ambiente de treinamento (T20 · módulo 6). Estado
  separado de qualquer dado "real" de caso — exercício não gera
  decisão, notificação nem auditoria no ambiente de produção.
*/
const trainingAttempts = new Map<string, TrainingAttemptResult>();

/*
  Estado in-memory do módulo 4 (T13). Os arrays só sofrem `unshift` /
  `splice(x,1, updated)` — nunca `delete`. Cadeia decisória é
  append-only por contrato (AGENTS.md §1.1).
*/
const casosMutable: Caso[] = casosFixture.map((c) => ({ ...c }));
const caseDecisionsMutable: CaseDecision[] = [...caseDecisionsFixture];
const caseDocumentsMutable: CaseDocument[] = [...caseDocumentsFixture];

let decisionSeq = caseDecisionsMutable.length + 1;
let documentSeq = caseDocumentsMutable.length + 1;

/*
  Estado in-memory do módulo 2 (T06/T07).
  - Non-filers: fila priorizada; "Iniciar inscrição de ofício" abre um
    caso candidato REAL em `casosMutable` (aparece na fila /cases) —
    sempre por ação explícita do auditor (AGENTS.md §1.1).
  - CTC: a simulação de lotes vive em fixtures/ctc-feed.ts; aqui só a
    sequência de casos abertos a partir de alertas antecipados.
*/
const nonFilersMutable: NonFiler[] = nonFilersFixture.map((nf) => ({
  ...nf,
  indicios: nf.indicios.map((i) => ({ ...i })),
}));
let radarCaseSeq = 1;
let ctcCaseSeq = 1;

/*
  Estado in-memory do módulo 7 (T21 · Geofiscalização).
  "Gerar caso" abre um caso candidato REAL em `casosMutable` (aparece na
  fila /cases com badge AGENTE) — sempre por ação explícita do auditor
  (AGENTS.md §1.1). Idempotente: segunda tentativa devolve 409.
*/
const geoObrasMutable: GeoObra[] = geoObrasFixture.map((o) => ({
  ...o,
  deteccao: { ...o.deteccao },
  alvara: { ...o.alvara },
}));
let geoCaseSeq = 1;

/*
  Estado in-memory do Portal do Contribuinte (T16 · módulo 4).
  Interações são append-only; cada ação gera protocolo próprio e uma
  devolutiva no caso do auditor (notificação `devolutiva` no sino +
  atualização de `observacoes` do caso — visível no dossiê T13/T14).
*/
/*
  Sessão mock do portal: representa um contador que atende 3 empresas
  (RF07 — acesso pelo contribuinte OU pelo contador). O portal só expõe
  casos já formalizados ao contribuinte — `candidato`/`em_analise`/
  `aguardando_aprovacao` são triagem interna e mostrá-los antes da
  notificação violaria o sigilo fiscal (art. 198 CTN).
*/
const CITIZEN_TAXPAYER_IDS = ["ct-002", "ct-003", "ct-004"] as const;
const CITIZEN_VISIBLE_STATUSES: readonly Caso["status"][] = [
  "notificado",
  "em_autorregularizacao",
  "fiscalizacao",
  "encerrado",
];
const citizenInteracoesMutable: CitizenInteracao[] = [];
let citizenProtocoloSeq = 481_002;
let guiaSeq = 77;

function nextProtocolo(): string {
  citizenProtocoloSeq += 1;
  return `PRT-2026-${String(citizenProtocoloSeq).padStart(6, "0")}`;
}

/*
  Pré-triagem do agente (T14): recomendação NÃO vinculante gerada quando
  a devolutiva chega. Determinística por tipo — quem decide é o auditor.
*/
function buildPreTriagem(
  tipo: CitizenInteracaoTipo,
  resumo: string,
): DevolutivaPreTriagem | undefined {
  switch (tipo) {
    case "contestacao":
      return {
        recomendacao: "solicitar_complemento",
        resumo:
          "Contestação sem documento fiscal que comprove a alegação — o agente sugere solicitar complemento antes de rever a divergência.",
        confianca: 0.68,
      };
    case "adesao_parcelamento":
      return {
        recomendacao: "acatar",
        resumo:
          "Adesão formal ao parcelamento com 1ª guia emitida — o agente sugere acatar e acompanhar o recolhimento.",
        confianca: 0.9,
      };
    case "agendamento":
      return {
        recomendacao: "acatar",
        resumo: `Pedido de atendimento dentro do prazo do caso: ${resumo}`,
        confianca: 0.82,
      };
    default:
      return undefined;
  }
}

function pushCitizenInteracao(
  casoId: string,
  tipo: CitizenInteracaoTipo,
  resumo: string,
): CitizenInteracao {
  const interacao: CitizenInteracao = {
    id: `ci-${Date.now()}-${citizenInteracoesMutable.length + 1}`,
    casoId,
    tipo,
    protocolo: nextProtocolo(),
    resumo,
    criadoEm: new Date().toISOString(),
    preTriagem: buildPreTriagem(tipo, resumo),
  };
  citizenInteracoesMutable.unshift(interacao);
  return interacao;
}

/** Devolutiva do contribuinte no sino do auditor (aceite T16 × T14). */
function pushDevolutivaNotification(caso: Caso, titulo: string, corpo: string): void {
  notificacoesMutable.unshift({
    id: `nt-dev-${caso.id}-${Date.now()}`,
    tipo: "devolutiva",
    titulo,
    corpo,
    casoId: caso.id,
    contribuinteId: caso.contribuinteId,
    severidade: 3,
    criadoEm: new Date().toISOString(),
    lida: false,
    origem: "manual",
    // Deep-link T14: o sino leva direto ao dossiê do caso.
    linkHref: `/cases?caso=${caso.id}`,
  });
}

/*
  Anotações do auditor no caso (T14) — append-only, como toda trilha do
  módulo 4. Seed com notas de instrução para o dossiê não nascer vazio.
*/
const caseAnnotationsMutable: CaseAnnotation[] = [];
let annotationSeq = 1;

function pushAnnotation(
  casoId: string,
  autor: { id: string; nome: string; papel: Role },
  texto: string,
  criadoEm?: string,
): CaseAnnotation {
  const annotation: CaseAnnotation = {
    id: `an-2026-${String(annotationSeq).padStart(4, "0")}`,
    casoId,
    autorId: autor.id,
    autorNome: autor.nome,
    autorPapel: autor.papel,
    texto,
    criadoEm: criadoEm ?? new Date().toISOString(),
  };
  annotationSeq += 1;
  caseAnnotationsMutable.unshift(annotation);
  return annotation;
}

/*
  Seed T14: uma devolutiva pendente (contestação) e anotações de
  instrução num caso formalizado — o dossiê demonstra o fluxo completo
  sem depender de uma ação prévia no portal do cidadão.
*/
function seedCaseCollab(): void {
  const alvo = casosMutable.find(
    (c) => isCitizenVisible(c) && c.status === "notificado" && (c.valorPotencial ?? 0) > 0,
  );
  if (!alvo) return;

  const contestacao: CitizenInteracao = {
    id: "ci-seed-0001",
    casoId: alvo.id,
    tipo: "contestacao",
    protocolo: "PRT-2026-480991",
    resumo:
      'Contestação enviada: "Notas emitidas em duplicidade no período" com 2 documento(s) anexado(s). Em análise pela equipe fiscal.',
    criadoEm: "2026-07-03T14:22:00Z",
    preTriagem: {
      recomendacao: "solicitar_complemento",
      resumo:
        "Os anexos não incluem as NFS-e supostamente duplicadas — o agente sugere solicitar os documentos fiscais antes de rever a divergência.",
      confianca: 0.72,
    },
  };
  citizenInteracoesMutable.push(contestacao);

  /*
    Segundo evento do seed: guia emitida (não usa `ciencia` para não
    colidir com o bloqueio de duplicidade do fluxo T16).
  */
  const guia: CitizenInteracao = {
    id: "ci-seed-0002",
    casoId: alvo.id,
    tipo: "guia_emitida",
    protocolo: "PRT-2026-480972",
    resumo: "Guia DAM-2026-00061 emitida para pagamento integral (vencimento 15/07/2026).",
    criadoEm: "2026-07-01T09:10:00Z",
  };
  citizenInteracoesMutable.push(guia);

  pushAnnotation(
    alvo.id,
    { id: "aud-0001", nome: "Carlos Andrade", papel: "auditor" },
    "Conferi as NFS-e da competência 05/2026: numeração sequencial sem lacunas. A alegação de duplicidade precisa vir acompanhada dos pares de notas.",
    "2026-07-03T16:40:00Z",
  );
  pushAnnotation(
    alvo.id,
    { id: "aud-0001", nome: "Carlos Andrade", papel: "auditor" },
    "Contribuinte tem histórico de regularização espontânea em 2024 — priorizar canal de autorregularização antes de escalar.",
    "2026-07-02T10:05:00Z",
  );
}

function isCitizenVisible(caso: Caso): boolean {
  return (
    (CITIZEN_TAXPAYER_IDS as readonly string[]).includes(caso.contribuinteId) &&
    CITIZEN_VISIBLE_STATUSES.includes(caso.status)
  );
}

function findCitizenCase(casoId: string): Caso | undefined {
  return casosMutable.find((c) => c.id === casoId && isCitizenVisible(c));
}

function buildGuiaDam(descricao: string, valor: number, vencimento: string): GuiaDam {
  guiaSeq += 1;
  const numero = `DAM-2026-${String(guiaSeq).padStart(5, "0")}`;
  /*
    Linha digitável sintética (nunca um boleto real): blocos derivados
    do sequencial para permanecer estável em snapshot/demonstração.
  */
  const bloco = String(guiaSeq).padStart(5, "0");
  const centavos = String(Math.round(valor * 100)).padStart(10, "0");
  const linhaDigitavel = `8${bloco}0000${centavos.slice(0, 5)} ${centavos.slice(5)}0${bloco} 03340${bloco} 9 ${vencimento.replaceAll("-", "")}`;
  return {
    numero,
    descricao,
    valor,
    vencimento,
    linhaDigitavel,
    emitidaEm: new Date().toISOString(),
  };
}

/*
  Estado in-memory do módulo 3 (T02 · Configuração do Modelo de Risco).
  A configuração vigente é substituída a cada publish; o histórico é
  append-only (unshift) e reflete o critério de aceite "histórico de
  alterações de parâmetros (quem/quando)".
*/
let riskModelConfigMutable: RiskModelConfig = { ...riskModelConfigFixture };
const riskModelHistoryMutable: RiskModelChange[] = [...riskModelHistoryFixture];
let riskModelChangeSeq = riskModelHistoryMutable.length + 1;

function bumpRiskModelVersion(current: string): string {
  const match = /^v(\d+)\.(\d+)(?:\.(\d+))?$/.exec(current);
  if (!match) return `${current}+1`;
  const [, majorStr, minorStr, patchStr] = match;
  if (patchStr !== undefined) {
    return `v${majorStr}.${minorStr}.${Number(patchStr) + 1}`;
  }
  return `v${majorStr}.${Number(minorStr) + 1}`;
}

/*
  Estado in-memory do módulo 6 (T19 · Governança/Conformidade).
  A trilha e o cadastro de usuários são append-only (updates viram
  novo evento). "Delete" de usuário é rebatido para status=inativo —
  jamais splice — pra preservar a cadeia de custódia (AGENTS.md §1.1).
*/
const auditLogMutable: AuditLogEntry[] = [...auditLogExtendedFixture];
const atypicalAccessesMutable: AtypicalAccess[] = [...atypicalAccessesFixture];
const systemUsersMutable: SystemUser[] = systemUsersFixture.map((u) => ({
  ...u,
}));

let auditLogSeq = auditLogMutable.length + 100;
let userSeq = systemUsersMutable.length + 100;

/*
  Estado in-memory do módulo 5 (T17 · Painel do Gestor). A meta de
  usabilidade sofre mutação quando o auditor submete uma avaliação
  SUS (o `atual` é recalculado como média); avaliações SUS são
  append-only.

  A regra "meta em risco" é aplicada em cada leitura das metas,
  garantindo que uma queda repentina de `atual` gere notificação
  automática no sino sem precisar de job em background — modelo POC.
*/
const metasMutable: MetaPiloto[] = metasPilotoFixture.map((m) => ({ ...m }));
const susAvaliacoesMutable: SusAvaliacao[] = [...susAvaliacoesFixture];

let susSeq = susAvaliacoesMutable.length + 1;
const metasAlertadas = new Set<string>(
  metasMutable.filter((m) => m.status === "em_risco" || m.status === "critico").map((m) => m.id),
);

function ensureMetaRiskNotifications(now: Date = new Date()): MetaPiloto[] {
  const refreshed = metasMutable.map((m) => refreshMeta(m, now));
  // Substitui in-place: `refreshed[i]` é garantido por construção do map,
  // mas `noUncheckedIndexedAccess` obriga o narrowing explícito.
  for (let i = 0; i < refreshed.length; i += 1) {
    const next = refreshed[i];
    if (next) metasMutable[i] = next;
  }
  for (const meta of refreshed) {
    const inRisk = meta.status === "em_risco" || meta.status === "critico";
    if (inRisk && !metasAlertadas.has(meta.id)) {
      const severidade = meta.status === "critico" ? 5 : 4;
      const titulo = `Meta em risco · ${meta.nome}`;
      const corpo =
        meta.status === "critico"
          ? `${meta.nome} está com progresso crítico (${Math.round(meta.progressoPct * 100)}%) e prazo próximo. Ação urgente do gestor.`
          : `${meta.nome} está em risco: progresso ${Math.round(meta.progressoPct * 100)}%. Revise o plano do piloto.`;
      notificacoesMutable.unshift({
        id: `nt-meta-${meta.id}-${now.getTime()}`,
        tipo: "meta_risco",
        titulo,
        corpo,
        metaId: meta.id,
        severidade,
        criadoEm: now.toISOString(),
        lida: false,
        origem: "auto_meta",
        linkHref: "/analytics#metas",
      });
      metasAlertadas.add(meta.id);
    } else if (!inRisk && metasAlertadas.has(meta.id)) {
      metasAlertadas.delete(meta.id);
    }
  }
  return refreshed;
}

function pushAudit(
  entry: Omit<AuditLogEntry, "id" | "correlationId"> & {
    correlationId?: string;
  },
): AuditLogEntry {
  const id = `aud-2026-${String(auditLogSeq).padStart(6, "0")}`;
  auditLogSeq += 1;
  const full: AuditLogEntry = {
    ...entry,
    id,
    correlationId: entry.correlationId ?? generateCorrelationId(),
  };
  auditLogMutable.unshift(full);
  return full;
}

const ROLE_DISPLAY: Record<Role, string> = {
  auditor: "Auditor Fiscal",
  supervisor: "Gestor Supervisor",
  admin: "Administrador",
  cidadao: "Contribuinte",
  agente_sistema: "Agente do sistema",
};

const KIND_LABEL: Record<"termo_intimacao" | "termo_inicio_fiscalizacao", string> = {
  termo_intimacao: "Termo de Intimação",
  termo_inicio_fiscalizacao: "Termo de Início de Fiscalização",
};

function generateCorrelationId(): string {
  return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildDocumentBody(
  kind: "termo_intimacao" | "termo_inicio_fiscalizacao",
  caso: Caso,
  numero: string,
  emitidoPor: string,
): string {
  if (kind === "termo_intimacao") {
    return `# Termo de Intimação ${numero}\n\n**Prefeitura Municipal de Brusque · Secretaria da Fazenda**\n\nAo contribuinte **${caso.contribuinteId}**, fica intimado a apresentar, no prazo de **10 (dez) dias úteis**, as informações e documentos necessários ao esclarecimento das divergências apuradas neste caso.\n\n**Recomendação embasadora**: ${caso.recomendacao?.justificativa ?? "Análise fiscal em andamento."}\n\n**Fundamento**: Art. 195 do CTN c/c legislação municipal aplicável.\n\nEmitido por ${emitidoPor} em ${new Date().toISOString()}.\n`;
  }
  return `# Termo de Início de Fiscalização ${numero}\n\n**Prefeitura Municipal de Brusque · Secretaria da Fazenda**\n\nDá-se por iniciada, nesta data, ação fiscal em face do contribuinte **${caso.contribuinteId}**.\n\n**Escopo**: revisão de obrigações principais e acessórias relativas ao caso ${caso.id}.\n\n**Recomendação embasadora**: ${caso.recomendacao?.justificativa ?? "Divergência que exige verificação in loco."}\n\nEmitido por ${emitidoPor} em ${new Date().toISOString()}.\n`;
}

const LoginRequestSchema = z.object({
  email: z.string().email().optional(),
  cpfCnpj: z.string().optional(),
  password: z.string().min(1),
  role: RoleSchema.optional(),
});

const LoginResponseSchema = z.object({
  role: RoleSchema,
  mockUser: z.object({
    id: z.string(),
    displayName: z.string(),
  }),
  issuedAt: z.string(),
});

function respondValidated<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  init?: { status?: number },
): Response {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return HttpResponse.json(
      {
        error_code: "mock_schema_violation",
        message: "Fixture não bate com o schema declarado.",
        issues: parsed.error.issues,
      },
      { status: 500 },
    );
  }
  return HttpResponse.json(parsed.data as never, init);
}

seedCaseCollab();

/*
  Gate de "perfis internos" (T18/T24 — Copilot e busca global). Reflete o
  mesmo conjunto de AUDITOR_ROLES de apps/web/lib/roles.ts, replicado aqui
  em vez de importado porque os demais handlers RBAC já seguem esse padrão
  inline (ver POST /ai/risk-model/config acima).
*/
function isInternalRole(role: Role): boolean {
  return role === "auditor" || role === "supervisor" || role === "admin";
}

function readActorRole(request: Request): Role {
  const roleParsed = RoleSchema.safeParse(request.headers.get("X-Actor-Role"));
  return roleParsed.success ? roleParsed.data : "auditor";
}

export const handlers = [
  // Módulo 1 — Ingestão
  http.get(`${API_URL}/ingestion/files`, () =>
    respondValidated(z.array(ArquivoIngeridoSchema), arquivosFixture),
  ),

  // Módulo 2 — Cruzamento
  http.get(`${API_URL}/crossing/divergences`, () =>
    respondValidated(z.array(DivergenciaSchema), divergenciasFixture),
  ),

  // Módulo 2 — Non-filer Discovery (T06 · RF02)
  // Fila priorizada pela receita estimada não declarada (desc).
  http.get(`${API_URL}/crossing/non-filers`, () =>
    respondValidated(
      z.array(NonFilerSchema),
      [...nonFilersMutable].sort((a, b) => b.receitaEstimada12m - a.receitaEstimada12m),
    ),
  ),

  /*
    "Iniciar inscrição de ofício" — abre caso candidato REAL na fila do
    módulo 4. Ação exige confirmação do auditor na UI; aqui o efeito é
    idempotente: segunda tentativa devolve 409 com o caso já aberto.
  */
  http.post(`${API_URL}/crossing/non-filers/:id/open-case`, ({ params }) => {
    const { id } = params as { id: string };
    const nonFiler = nonFilersMutable.find((nf) => nf.id === id);
    if (!nonFiler) {
      return HttpResponse.json(
        {
          error_code: "non_filer_not_found",
          message: "Prestador fora do radar não encontrado.",
        },
        { status: 404 },
      );
    }
    if (nonFiler.status === "caso_aberto") {
      return HttpResponse.json(
        {
          error_code: "non_filer_case_already_open",
          message: "Já existe caso candidato aberto para este prestador.",
          casoId: nonFiler.casoId,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const caso: Caso = {
      id: `cs-2026-r${String(radarCaseSeq).padStart(3, "0")}`,
      contribuinteId: nonFiler.id,
      status: "candidato",
      criadoEm: now,
      atualizadoEm: now,
      agenteResponsavel: "ag-orquestrador",
      scoreValor: undefined,
      divergenciaIds: [],
      valorPotencial: nonFiler.receitaEstimada12m,
      periodoApuracao: "últimos 12 meses",
      tributo: "iss",
      proximaAcaoRecomendada: `Iniciar inscrição de ofício — ${nonFiler.nomeIndicado} sem cadastro mobiliário com receita estimada de R$ ${Math.round(nonFiler.receitaEstimada12m / 1000)} mil/ano.`,
      recomendacao: {
        acao: "fiscalizacao",
        justificativa: `Prestador fora do radar identificado por ${nonFiler.indicios.length} indício(s): ${nonFiler.indicios.map((i) => i.referencia).join("; ")}. Sem inscrição municipal nem declaração compatível.`,
        confianca: 0.75,
        baseadaEm: [nonFiler.id],
      },
      observacoes: `Caso aberto a partir do Non-filer Discovery (T06). Atividade presumida: ${nonFiler.atividadePresumida}.`,
    };
    radarCaseSeq += 1;
    casosMutable.unshift(caso);

    nonFiler.status = "caso_aberto";
    nonFiler.casoId = caso.id;

    return respondValidated(
      z.object({ nonFiler: NonFilerSchema, caso: CasoSchema }),
      { nonFiler, caso },
      { status: 201 },
    );
  }),

  // Módulo 2 — Feed de Monitoramento Contínuo CTC (T07 · RF09/FA10)
  http.get(`${API_URL}/crossing/ctc/feed`, () => respondValidated(CtcFeedSchema, getCtcFeed())),

  /*
    Sugerir convite à autorregularização a partir de um alerta
    antecipado. Abre caso candidato com recomendação estruturada —
    a decisão final continua com o auditor no módulo 4.
  */
  http.post(`${API_URL}/crossing/ctc/alerts/:id/suggest`, ({ params }) => {
    const { id } = params as { id: string };
    const alerta = findCtcAlert(id);
    if (!alerta) {
      return HttpResponse.json(
        {
          error_code: "ctc_alert_not_found",
          message: "Alerta não está mais na janela do feed.",
        },
        { status: 404 },
      );
    }
    if (alerta.sugestaoEnviada) {
      return HttpResponse.json(
        {
          error_code: "ctc_suggestion_already_sent",
          message: "Convite à autorregularização já sugerido para este alerta.",
          casoId: alerta.casoId,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const caso: Caso = {
      id: `cs-2026-c${String(ctcCaseSeq).padStart(3, "0")}`,
      contribuinteId: alerta.contribuinteId,
      status: "candidato",
      criadoEm: now,
      atualizadoEm: now,
      agenteResponsavel: "ag-orquestrador",
      scoreValor: alerta.scoreIncremental,
      divergenciaIds: [],
      tributo: "iss",
      proximaAcaoRecomendada: `Alerta antecipado pelo CTC (${alerta.janelaMinutos} min após o fato gerador) — avaliar convite à autorregularização.`,
      recomendacao: {
        acao: "autorregularizacao",
        justificativa: `Regra "${alerta.regra}" disparou no monitoramento contínuo: ${alerta.descricao}`,
        confianca: 0.7,
        baseadaEm: [alerta.id],
      },
      observacoes: "Caso aberto a partir do feed CTC (T07) — detecção em quase tempo real.",
    };
    ctcCaseSeq += 1;
    casosMutable.unshift(caso);

    alerta.sugestaoEnviada = true;
    alerta.casoId = caso.id;

    return respondValidated(
      z.object({ alertaId: z.string(), casoId: z.string() }),
      { alertaId: alerta.id, casoId: caso.id },
      { status: 201 },
    );
  }),

  // Módulo 1/2 — NFS-e (evidências primárias das divergências e do dossiê T13/T28)
  http.get(`${API_URL}/nfse`, () => respondValidated(z.array(NFSeSchema), nfseFixture)),

  // Módulo 3 — IA Preditiva
  http.get(`${API_URL}/ai/scores`, () => respondValidated(z.array(ScoreSchema), scoresFixture)),
  http.get(`${API_URL}/ai/agents`, () => respondValidated(z.array(AgenteSchema), agentesFixture)),

  /*
    T08 — Fila priorizada do auditor (RF03/FA03). O mock compõe
    score + cadastro + caso vinculado + divergência principal numa linha
    só, ordenada por score desc — mesma agregação que o serviço real fará.
    Coerência: `valorPotencial` prefere o valor do caso vinculado (bate
    com o Kanban); sem caso, usa a estimativa da fixture 360.
  */
  http.get(`${API_URL}/ai/queue`, () => {
    const queue: RiskQueueItem[] = scoresFixture.flatMap((score) => {
      const contribuinte = contribuintesFixture.find((c) => c.id === score.contribuinteId);
      if (!contribuinte) return [];

      const casoRecente = casosMutable
        .filter((caso) => caso.contribuinteId === score.contribuinteId)
        .sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))[0];

      const divergenciaPrincipal = divergenciasFixture
        .filter((dv) => dv.contribuinteId === score.contribuinteId)
        .sort((a, b) => b.severidade - a.severidade)[0];

      return [
        {
          contribuinteId: contribuinte.id,
          razaoSocial: contribuinte.razaoSocial,
          nomeFantasia: contribuinte.nomeFantasia,
          cnpjMascarado: contribuinte.cnpjMascarado,
          setor: contribuinte.atividadePrincipal,
          regime: contribuinte.regime,
          situacao: contribuinte.situacao,
          scoreValor: score.valor,
          nivel: score.nivel,
          valorPotencial:
            casoRecente?.valorPotencial ?? valorPotencialEstimadoFixture[contribuinte.id],
          statusTratamento: casoRecente?.status ?? "sem_tratamento",
          casoId: casoRecente?.id,
          tipoInconsistencia: divergenciaPrincipal?.tipo,
          calculadoEm: score.calculadoEm,
          modeloVersao: score.modeloVersao,
        },
      ];
    });

    queue.sort((a, b) => b.scoreValor - a.scoreValor);
    return respondValidated(z.array(RiskQueueItemSchema), queue);
  }),

  // Módulo 3 — Configuração do Modelo de Risco (T02)
  http.get(`${API_URL}/ai/risk-model/config`, () =>
    respondValidated(RiskModelConfigSchema, riskModelConfigMutable),
  ),

  http.get(`${API_URL}/ai/risk-model/history`, () => {
    const ordered = [...riskModelHistoryMutable].sort((a, b) =>
      a.timestamp < b.timestamp ? 1 : -1,
    );
    return respondValidated(z.array(RiskModelChangeSchema), ordered);
  }),

  http.post(`${API_URL}/ai/risk-model/config`, async ({ request }) => {
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = RiskModelPublishRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_risk_model_body",
          message: "Corpo da publicação de modelo inválido.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    /*
      Regra de negócio dos limiares: 0 < baixo < medio < alto < critico ≤ 100.
      O front já valida antes de enviar, mas replicamos aqui para blindar o
      contrato — o mesmo check será exigido do serviço real.
    */
    const { baixo, medio, alto, critico } = parsed.data.bands;
    if (!(0 < baixo && baixo < medio && medio < alto && alto < critico && critico <= 100)) {
      return HttpResponse.json(
        {
          error_code: "invalid_risk_bands",
          message: "As faixas de score precisam seguir 0 < baixo < médio < alto < crítico ≤ 100.",
        },
        { status: 422 },
      );
    }

    const roleHeader = request.headers.get("X-Actor-Role");
    const nomeHeader = request.headers.get("X-Actor-Name");
    const idHeader = request.headers.get("X-Actor-Id");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "supervisor";

    /*
      RBAC do MSW replica o guard client-side: apenas Gestor/Admin podem
      publicar. Se o header não vier ou vier de auditor/cidadão, recusamos —
      alinhado ao critério de aceite "Auditor Fiscal e Contribuinte não
      acessam a tela".
    */
    if (atorPapel !== "supervisor" && atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Gestor e Administrador podem publicar o modelo de risco.",
        },
        { status: 403 },
      );
    }

    const atorId = idHeader ?? `mock-${atorPapel}`;
    const atorNome = nomeHeader ?? ROLE_DISPLAY[atorPapel];
    const now = new Date();
    const correlationId = generateCorrelationId();
    const fromVersion = riskModelConfigMutable.version;
    const toVersion = bumpRiskModelVersion(fromVersion);

    const nextConfig: RiskModelConfig = {
      version: toVersion,
      updatedAt: now.toISOString(),
      updatedBy: atorNome,
      updatedByRole: atorPapel,
      weights: parsed.data.weights,
      bands: parsed.data.bands,
      rules: parsed.data.rules,
    };

    const change: RiskModelChange = {
      id: `rmc-${now.getFullYear()}-${String(riskModelChangeSeq).padStart(6, "0")}`,
      timestamp: now.toISOString(),
      actorId: atorId,
      actorName: atorNome,
      actorRole: atorPapel,
      correlationId,
      fromVersion,
      toVersion,
      summary: parsed.data.summary,
      fieldsChanged: parsed.data.fieldsChanged,
    };
    riskModelChangeSeq += 1;
    riskModelHistoryMutable.unshift(change);
    riskModelConfigMutable = nextConfig;

    return respondValidated(RiskModelPublishResponseSchema, {
      config: nextConfig,
      change,
    });
  }),

  // Contribuintes — usado para enriquecer dossiê (razão social, CNAE, regime)
  http.get(`${API_URL}/taxpayers`, () =>
    respondValidated(z.array(ContribuinteSchema), contribuintesFixture),
  ),
  http.get(`${API_URL}/taxpayers/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = contribuintesFixture.find((c) => c.id === id);
    if (!found) {
      return HttpResponse.json(
        {
          error_code: "taxpayer_not_found",
          message: "Contribuinte não encontrado.",
        },
        { status: 404 },
      );
    }
    return respondValidated(ContribuinteSchema, found);
  }),

  /*
    T08 — Visão 360 do contribuinte (RF03/FA03). Agregado read-only:
    cadastro + score atual (T09) + históricos (declarações, dívida ativa,
    pagamentos, evolução do score) + NFS-e emitidas + casos vinculados.
    Contribuinte sem score/históricos devolve arrays vazios — a UI
    exercita os empty states com eles.
  */
  http.get(`${API_URL}/taxpayers/:id/360`, ({ params }) => {
    const { id } = params as { id: string };
    const contribuinte = contribuintesFixture.find((c) => c.id === id);
    if (!contribuinte) {
      return HttpResponse.json(
        {
          error_code: "taxpayer_not_found",
          message: "Contribuinte não encontrado.",
        },
        { status: 404 },
      );
    }

    const casosVinculados = casosMutable
      .filter((caso) => caso.contribuinteId === id)
      .sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1));

    return respondValidated(Contribuinte360Schema, {
      contribuinte,
      score: scoresFixture.find((s) => s.contribuinteId === id),
      scoreHistorico: scoreHistoricoFixture[id] ?? [],
      declaracoes: declaracoesFixture[id] ?? [],
      nfse: nfseFixture.filter((nf) => nf.prestadorId === id),
      dividaAtiva: dividaAtivaFixture[id] ?? [],
      pagamentos: pagamentosFixture[id] ?? [],
      casos: casosVinculados,
    });
  }),

  // Módulo 4 — Casos
  http.get(`${API_URL}/cases`, () => respondValidated(z.array(CasoSchema), casosMutable)),

  http.get(`${API_URL}/cases/:id/decisions`, ({ params }) => {
    const { id } = params as { id: string };
    const trilha = caseDecisionsMutable
      .filter((d) => d.casoId === id)
      .slice()
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return respondValidated(z.array(CaseDecisionSchema), trilha);
  }),

  http.get(`${API_URL}/cases/:id/documents`, ({ params }) => {
    const { id } = params as { id: string };
    const docs = caseDocumentsMutable
      .filter((d) => d.casoId === id)
      .slice()
      .sort((a, b) => (a.emitidoEm < b.emitidoEm ? 1 : -1));
    return respondValidated(z.array(CaseDocumentSchema), docs);
  }),

  // ── T14 · Anotações do auditor (append-only) ────────────────────────
  http.get(`${API_URL}/cases/:id/annotations`, ({ params }) => {
    const { id } = params as { id: string };
    const notas = caseAnnotationsMutable
      .filter((a) => a.casoId === id)
      .slice()
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
    return respondValidated(z.array(CaseAnnotationSchema), notas);
  }),

  http.post(`${API_URL}/cases/:id/annotations`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const caso = casosMutable.find((c) => c.id === id);
    if (!caso) {
      return HttpResponse.json(
        { error_code: "case_not_found", message: "Caso não encontrado." },
        { status: 404 },
      );
    }
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = AnnotationRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_annotation_body",
          message: "A anotação precisa ter pelo menos 5 caracteres.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const papel: Role = roleParsed.success ? roleParsed.data : "auditor";
    if (papel === "cidadao") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas a equipe fiscal pode anotar o caso.",
        },
        { status: 403 },
      );
    }

    const annotation = pushAnnotation(
      id,
      {
        id: request.headers.get("X-Actor-Id") ?? `mock-${papel}`,
        nome: request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[papel],
        papel,
      },
      parsed.data.texto,
    );
    caso.atualizadoEm = new Date().toISOString();
    return respondValidated(CaseAnnotationSchema, annotation, { status: 201 });
  }),

  // ── T14 · Devolutivas eletrônicas no lado do auditor ────────────────
  http.get(`${API_URL}/cases/:id/interacoes`, ({ params }) => {
    const { id } = params as { id: string };
    const timeline = citizenInteracoesMutable.filter((i) => i.casoId === id);
    return respondValidated(z.array(CitizenInteracaoSchema), timeline);
  }),

  /*
    Tratamento da devolutiva (Acatar / Manter / Solicitar complemento).
    Registra autoria + justificativa e vira evento da linha do tempo —
    imutável depois de gravado (AGENTS.md §1.1).
  */
  http.post(
    `${API_URL}/cases/:id/interacoes/:interacaoId/tratamento`,
    async ({ params, request }) => {
      const { id, interacaoId } = params as { id: string; interacaoId: string };
      const caso = casosMutable.find((c) => c.id === id);
      const interacao = citizenInteracoesMutable.find(
        (i) => i.id === interacaoId && i.casoId === id,
      );
      if (!caso || !interacao) {
        return HttpResponse.json(
          { error_code: "devolutiva_not_found", message: "Devolutiva não encontrada." },
          { status: 404 },
        );
      }
      if (interacao.tratamento) {
        return HttpResponse.json(
          {
            error_code: "devolutiva_ja_tratada",
            message: "Esta devolutiva já recebeu tratamento do auditor.",
          },
          { status: 409 },
        );
      }

      const bodyRaw = await request.json().catch(() => ({}));
      const parsed = DevolutivaTratamentoRequestSchema.safeParse(bodyRaw);
      if (!parsed.success) {
        return HttpResponse.json(
          {
            error_code: "invalid_tratamento_body",
            message: "Escolha a ação e justifique o tratamento (mínimo 10 caracteres).",
            issues: parsed.error.issues,
          },
          { status: 400 },
        );
      }

      const roleHeader = request.headers.get("X-Actor-Role");
      const roleParsed = RoleSchema.safeParse(roleHeader);
      const papel: Role = roleParsed.success ? roleParsed.data : "auditor";
      if (papel === "cidadao") {
        return HttpResponse.json(
          {
            error_code: "forbidden_role",
            message: "Apenas a equipe fiscal pode tratar devolutivas.",
          },
          { status: 403 },
        );
      }

      interacao.tratamento = {
        acao: parsed.data.acao,
        justificativa: parsed.data.justificativa,
        tratadoPorId: request.headers.get("X-Actor-Id") ?? `mock-${papel}`,
        tratadoPorNome: request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[papel],
        tratadoEm: new Date().toISOString(),
      };

      const ACAO_LABEL: Record<typeof parsed.data.acao, string> = {
        acatar: "acatada",
        manter: "mantida (divergência confirmada)",
        solicitar_complemento: "com complemento solicitado ao contribuinte",
      };
      caso.observacoes = `Devolutiva ${interacao.protocolo} ${ACAO_LABEL[parsed.data.acao]} por ${interacao.tratamento.tratadoPorNome}: ${parsed.data.justificativa}`;
      caso.atualizadoEm = new Date().toISOString();

      return respondValidated(
        z.object({ interacao: CitizenInteracaoSchema, caso: CasoSchema }),
        { interacao, caso },
        { status: 201 },
      );
    },
  ),

  // Módulo 3 — Análise de Redes / Graph Analytics (T12)
  http.get(`${API_URL}/network/scenarios`, () =>
    respondValidated(z.array(NetworkScenarioSchema), networkScenariosFixture),
  ),

  http.post(`${API_URL}/cases/:id/decisions`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = DecisionRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_decision_body",
          message: "Corpo da decisão inválido.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }
    const idx = casosMutable.findIndex((c) => c.id === id);
    const casoAtual = idx >= 0 ? casosMutable[idx] : undefined;
    if (!casoAtual || idx < 0) {
      return HttpResponse.json(
        { error_code: "case_not_found", message: "Caso não encontrado." },
        { status: 404 },
      );
    }
    const roleHeader = request.headers.get("X-Actor-Role");
    const nomeHeader = request.headers.get("X-Actor-Name");
    const idHeader = request.headers.get("X-Actor-Id");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";
    const atorId = idHeader ?? `mock-${atorPapel}`;
    const atorNome = nomeHeader ?? ROLE_DISPLAY[atorPapel];

    const proximo = nextStatus({
      statusAtual: casoAtual.status,
      action: parsed.data.action,
      recomendacao: casoAtual.recomendacao?.acao,
    });
    if (!proximo) {
      return HttpResponse.json(
        {
          error_code: "invalid_transition",
          message: `Transição inválida para o caso ${id} (${casoAtual.status} · ${parsed.data.action}).`,
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const correlationId = generateCorrelationId();
    const decisionId = `dec-${now.getFullYear()}-${String(decisionSeq).padStart(6, "0")}`;
    decisionSeq += 1;

    const emitirDoc = shouldEmitDocument(
      casoAtual.status,
      parsed.data.action,
      casoAtual.recomendacao?.acao,
    );
    let documento: CaseDocument | undefined;
    if (emitirDoc) {
      const prefix = emitirDoc === "termo_intimacao" ? "TI" : "TIF";
      const numero = `${prefix}-${now.getFullYear()}-${String(documentSeq).padStart(4, "0")}`;
      documento = {
        id: `doc-${now.getFullYear()}-${String(documentSeq).padStart(4, "0")}`,
        casoId: casoAtual.id,
        kind: emitirDoc,
        numero,
        emitidoEm: now.toISOString(),
        emitidoPor: `${atorNome} (${ROLE_DISPLAY[atorPapel]})`,
        conteudo: buildDocumentBody(emitirDoc, casoAtual, numero, atorNome),
      };
      documentSeq += 1;
      caseDocumentsMutable.unshift(documento);
    }

    const decisao: CaseDecision = {
      id: decisionId,
      casoId: casoAtual.id,
      action: parsed.data.action,
      atorId,
      atorNome,
      atorPapel,
      correlationId,
      timestamp: now.toISOString(),
      justificativa: parsed.data.justificativa ?? parsed.data.observacoes,
      statusAnterior: casoAtual.status,
      statusPosterior: proximo,
      documentoGerado: documento?.id,
    };
    caseDecisionsMutable.unshift(decisao);

    const casoAtualizado: Caso = {
      ...casoAtual,
      status: proximo,
      atualizadoEm: now.toISOString(),
    };
    casosMutable[idx] = casoAtualizado;

    let notificacaoEmitida: Notificacao | undefined;
    if (parsed.data.action !== "ajustar") {
      const titulo =
        parsed.data.action === "aprovar"
          ? documento
            ? `${KIND_LABEL[documento.kind]} emitido · ${casoAtual.id}`
            : `Decisão aprovada · ${casoAtual.id}`
          : `Decisão rejeitada · ${casoAtual.id}`;
      const corpo =
        parsed.data.action === "aprovar"
          ? documento
            ? `Termo ${documento.numero} anexado ao caso. Nova fase: ${proximo}.`
            : `Caso movido para ${proximo}.`
          : `Justificativa: ${parsed.data.justificativa}`;
      notificacaoEmitida = {
        id: `nt-${now.getTime()}`,
        tipo: "caso_alto_risco",
        titulo,
        corpo,
        casoId: casoAtual.id,
        contribuinteId: casoAtual.contribuinteId,
        severidade: parsed.data.action === "aprovar" ? 4 : 3,
        criadoEm: now.toISOString(),
        lida: false,
        origem: "manual",
      };
      notificacoesMutable.unshift(notificacaoEmitida);
    }

    return respondValidated(
      z.object({
        caso: CasoSchema,
        decisao: CaseDecisionSchema,
        documento: CaseDocumentSchema.optional(),
        notificacao: NotificacaoSchema.optional(),
      }),
      {
        caso: casosMutable[idx],
        decisao,
        documento,
        notificacao: notificacaoEmitida,
      },
    );
  }),

  // Módulo 4 — Exportação do dossiê em PDF (T28)
  http.post(`${API_URL}/cases/:id/dossie/export`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";

    /*
      RBAC: cidadão não pode exportar peça processual (art. 198 CTN).
      Auditor/Supervisor/Admin sim — o auditor é o dono operacional
      do caso e é ele quem anexa o PDF como peça de instrução.
    */
    if (atorPapel !== "auditor" && atorPapel !== "supervisor" && atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Auditor, Gestor ou Administrador podem exportar o dossiê.",
        },
        { status: 403 },
      );
    }

    const casoAtual = casosMutable.find((c) => c.id === id);
    if (!casoAtual) {
      return HttpResponse.json(
        { error_code: "case_not_found", message: "Caso não encontrado." },
        { status: 404 },
      );
    }

    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = DossieExportRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_export_body",
          message: "Payload de export de dossiê inválido.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;

    const entry = pushAudit({
      timestamp: new Date().toISOString(),
      action: "caso.dossie.export",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: `caso:${id}`,
      result: "sucesso",
      atypical: false,
      correlationId: parsed.data.correlationId,
      details: `Exportação do dossiê em PDF do caso ${id} (${parsed.data.totalDivergencias} divergências${parsed.data.scoreValor !== undefined ? `, score ${parsed.data.scoreValor}` : ""}).`,
      dadosAcessados: `Caso ${id} · contribuinte ${casoAtual.contribuinteId}.`,
    });

    return respondValidated(DossieExportResponseSchema, { entry });
  }),

  // Módulo 4 — Central de Notificações Eletrônicas (T15)
  http.get(`${API_URL}/communications`, () =>
    respondValidated(z.array(ComunicacaoSchema), comunicacoesFixture),
  ),
  http.get(`${API_URL}/communications/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = comunicacoesFixture.find((c) => c.id === id);
    if (!found) {
      return HttpResponse.json(
        {
          error_code: "communication_not_found",
          message: "Comunicação não encontrada.",
        },
        { status: 404 },
      );
    }
    return respondValidated(ComunicacaoSchema, found);
  }),

  // ── Portal do Contribuinte (T16 · módulo 4) ─────────────────────────
  // A sessão mock enxerga só os casos formalizados dos CNPJs vinculados.
  http.get(`${API_URL}/citizen/cases`, () => {
    const meus = casosMutable.filter(isCitizenVisible);
    return respondValidated(z.array(CasoSchema), meus);
  }),

  // Acompanhamento em tempo real — linha do tempo de interações do caso.
  http.get(`${API_URL}/citizen/cases/:id/interacoes`, ({ params }) => {
    const { id } = params as { id: string };
    const timeline = citizenInteracoesMutable.filter((i) => i.casoId === id);
    return respondValidated(z.array(CitizenInteracaoSchema), timeline);
  }),

  // Divergências do próprio caso — recorte mínimo p/ explicação em
  // linguagem clara (não expõe a base completa de cruzamentos ao cidadão).
  http.get(`${API_URL}/citizen/cases/:id/divergencias`, ({ params }) => {
    const { id } = params as { id: string };
    const caso = findCitizenCase(id);
    if (!caso) {
      return HttpResponse.json(
        {
          error_code: "citizen_case_not_found",
          message: "Pendência não encontrada.",
        },
        { status: 404 },
      );
    }
    const ids = new Set(caso.divergenciaIds);
    const doCaso = divergenciasFixture.filter((d) => ids.has(d.id));
    return respondValidated(z.array(DivergenciaSchema), doCaso);
  }),

  // Registro de ciência com protocolo (RF07 — dá início ao passo 1).
  http.post(`${API_URL}/citizen/cases/:id/ciencia`, ({ params }) => {
    const { id } = params as { id: string };
    const caso = findCitizenCase(id);
    if (!caso) {
      return HttpResponse.json(
        {
          error_code: "citizen_case_not_found",
          message: "Pendência não encontrada.",
        },
        { status: 404 },
      );
    }
    const jaRegistrada = citizenInteracoesMutable.some(
      (i) => i.casoId === id && i.tipo === "ciencia",
    );
    if (jaRegistrada) {
      return HttpResponse.json(
        {
          error_code: "ciencia_ja_registrada",
          message: "A ciência já foi registrada.",
        },
        { status: 409 },
      );
    }

    const interacao = pushCitizenInteracao(
      id,
      "ciencia",
      "Ciência da notificação registrada pelo contribuinte.",
    );
    caso.observacoes = `Contribuinte registrou ciência em ${new Date().toLocaleDateString("pt-BR")} (protocolo ${interacao.protocolo}).`;
    caso.atualizadoEm = new Date().toISOString();
    pushDevolutivaNotification(
      caso,
      `Ciência registrada · ${caso.id.toUpperCase()}`,
      `O contribuinte ${caso.contribuinteId} registrou ciência da notificação (protocolo ${interacao.protocolo}).`,
    );
    return respondValidated(CitizenActionResponseSchema, { interacao, caso });
  }),

  // Emissão de guia integral (mock DAM) — pagamento à vista.
  http.post(`${API_URL}/citizen/cases/:id/guia`, ({ params }) => {
    const { id } = params as { id: string };
    const caso = findCitizenCase(id);
    if (!caso) {
      return HttpResponse.json(
        {
          error_code: "citizen_case_not_found",
          message: "Pendência não encontrada.",
        },
        { status: 404 },
      );
    }
    const valor = caso.valorPotencial ?? 0;
    if (valor <= 0) {
      return HttpResponse.json(
        {
          error_code: "guia_sem_valor",
          message: "Esta pendência não possui valor a recolher.",
        },
        { status: 422 },
      );
    }
    const vencimento = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const guia = buildGuiaDam(
      `Regularização integral — ${caso.id.toUpperCase()}`,
      valor,
      vencimento,
    );
    const interacao = pushCitizenInteracao(
      id,
      "guia_emitida",
      `Guia ${guia.numero} emitida para pagamento integral (vencimento ${new Date(`${vencimento}T12:00:00Z`).toLocaleDateString("pt-BR")}).`,
    );
    caso.atualizadoEm = new Date().toISOString();
    pushDevolutivaNotification(
      caso,
      `Guia emitida · ${caso.id.toUpperCase()}`,
      `O contribuinte ${caso.contribuinteId} emitiu a guia ${guia.numero} para regularização integral (protocolo ${interacao.protocolo}).`,
    );
    return respondValidated(CitizenActionResponseSchema, {
      interacao,
      caso,
      guia,
    });
  }),

  // Adesão ao parcelamento — transiciona o caso para autorregularização.
  http.post(`${API_URL}/citizen/cases/:id/parcelamento`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const caso = findCitizenCase(id);
    if (!caso) {
      return HttpResponse.json(
        {
          error_code: "citizen_case_not_found",
          message: "Pendência não encontrada.",
        },
        { status: 404 },
      );
    }
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = ParcelamentoAdesaoRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_parcelamento_body",
          message: "Número de parcelas inválido (1 a 12).",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }
    const valor = caso.valorPotencial ?? 0;
    if (valor <= 0) {
      return HttpResponse.json(
        {
          error_code: "parcelamento_sem_valor",
          message: "Esta pendência não possui valor a parcelar.",
        },
        { status: 422 },
      );
    }

    const plano = simulateParcelamento(valor, parsed.data.parcelas);
    const guia = buildGuiaDam(
      `Parcela 1/${plano.parcelas} — ${caso.id.toUpperCase()}`,
      plano.valorParcela,
      plano.primeiroVencimento,
    );
    const interacao = pushCitizenInteracao(
      id,
      "adesao_parcelamento",
      `Adesão ao parcelamento em ${plano.parcelas}x de R$ ${plano.valorParcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — guia ${guia.numero} da 1ª parcela emitida.`,
    );

    // Devolutiva estrutural: o caso migra para autorregularização.
    if (
      caso.status === "notificado" ||
      caso.status === "candidato" ||
      caso.status === "em_analise"
    ) {
      caso.status = "em_autorregularizacao";
    }
    caso.observacoes = `Contribuinte aderiu ao parcelamento em ${plano.parcelas}x (protocolo ${interacao.protocolo}) — 1ª parcela vence em ${new Date(`${plano.primeiroVencimento}T12:00:00Z`).toLocaleDateString("pt-BR")}.`;
    caso.proximaAcaoRecomendada = "Acompanhar o recolhimento das parcelas do termo de adesão.";
    caso.atualizadoEm = new Date().toISOString();
    pushDevolutivaNotification(
      caso,
      `Adesão ao parcelamento · ${caso.id.toUpperCase()}`,
      `O contribuinte ${caso.contribuinteId} aderiu ao parcelamento em ${plano.parcelas}x (protocolo ${interacao.protocolo}). Caso movido para autorregularização.`,
    );
    return respondValidated(CitizenActionResponseSchema, {
      interacao,
      caso,
      guia,
    });
  }),

  // Canal de resposta/contestação com upload mock + protocolo.
  http.post(`${API_URL}/citizen/cases/:id/contestacao`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const caso = findCitizenCase(id);
    if (!caso) {
      return HttpResponse.json(
        {
          error_code: "citizen_case_not_found",
          message: "Pendência não encontrada.",
        },
        { status: 404 },
      );
    }
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = ContestacaoRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_contestacao_body",
          message: "Preencha o assunto e uma mensagem com pelo menos 30 caracteres.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const anexos = parsed.data.arquivos.length;
    const interacao = pushCitizenInteracao(
      id,
      "contestacao",
      `Contestação enviada: "${parsed.data.assunto}"${anexos > 0 ? ` com ${anexos} documento(s) anexado(s)` : ""}. Em análise pela equipe fiscal.`,
    );
    caso.observacoes = `Contestação do contribuinte em análise (protocolo ${interacao.protocolo}): ${parsed.data.assunto}.`;
    caso.atualizadoEm = new Date().toISOString();
    pushDevolutivaNotification(
      caso,
      `Contestação recebida · ${caso.id.toUpperCase()}`,
      `O contribuinte ${caso.contribuinteId} contestou a divergência (protocolo ${interacao.protocolo}): "${parsed.data.assunto}". Requer análise do auditor.`,
    );
    return respondValidated(CitizenActionResponseSchema, { interacao, caso });
  }),

  // Agendamento de atendimento presencial/vídeo.
  http.post(`${API_URL}/citizen/cases/:id/agendamento`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const caso = findCitizenCase(id);
    if (!caso) {
      return HttpResponse.json(
        {
          error_code: "citizen_case_not_found",
          message: "Pendência não encontrada.",
        },
        { status: 404 },
      );
    }
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = AgendamentoRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_agendamento_body",
          message: "Escolha uma data e um período válidos.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }
    const dataLabel = new Date(`${parsed.data.data}T12:00:00Z`).toLocaleDateString("pt-BR");
    const periodoLabel = parsed.data.periodo === "manha" ? "manhã (8h–12h)" : "tarde (13h–17h)";
    const interacao = pushCitizenInteracao(
      id,
      "agendamento",
      `Atendimento agendado para ${dataLabel}, período da ${periodoLabel}.`,
    );
    caso.atualizadoEm = new Date().toISOString();
    pushDevolutivaNotification(
      caso,
      `Atendimento agendado · ${caso.id.toUpperCase()}`,
      `O contribuinte ${caso.contribuinteId} agendou atendimento para ${dataLabel} (${periodoLabel}) — protocolo ${interacao.protocolo}.`,
    );
    return respondValidated(CitizenActionResponseSchema, { interacao, caso });
  }),

  // Módulo 5 — Analytics
  http.get(`${API_URL}/analytics/kpis`, () => respondValidated(KPIsAnalyticsSchema, kpisFixture)),
  http.get(`${API_URL}/analytics/panel-kpis`, () =>
    respondValidated(PanelKpisSchema, panelKpisFixture),
  ),
  http.get(`${API_URL}/analytics/monthly-recovery`, () =>
    respondValidated(MonthlyRecoverySeriesSchema, monthlyRecoveryFixture),
  ),
  http.get(`${API_URL}/analytics/risk-distribution`, () =>
    respondValidated(RiskDistributionSchema, riskDistributionFixture),
  ),
  http.get(`${API_URL}/analytics/alerts`, () =>
    respondValidated(z.array(SmartAlertSchema), smartAlertsFixture),
  ),

  // Módulo 5 — Painel do Gestor (T17)
  http.get(`${API_URL}/analytics/panel-manager-kpis`, ({ request }) => {
    const url = new URL(request.url);
    const periodoRaw = url.searchParams.get("periodo") ?? "30d";
    const parsed = PanelManagerPeriodoSchema.safeParse(periodoRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_periodo",
          message: `Período inválido: '${periodoRaw}'. Use 30d, 90d, trimestre ou ano.`,
        },
        { status: 400 },
      );
    }
    return respondValidated(PanelManagerKpisSchema, buildPanelManagerKpisFixture(parsed.data));
  }),

  http.get(`${API_URL}/analytics/metas`, () => {
    const refreshed = ensureMetaRiskNotifications();
    return respondValidated(z.array(MetaPilotoSchema), refreshed);
  }),

  http.post(`${API_URL}/analytics/metas/:id/sus`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (id !== "meta-usabilidade") {
      return HttpResponse.json(
        {
          error_code: "meta_nao_aceita_sus",
          message: "SUS só se aplica à meta de usabilidade.",
        },
        { status: 400 },
      );
    }

    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = SusSubmitRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_sus_body",
          message: "Respostas SUS inválidas.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    let score: number;
    try {
      score = computeSusScore(parsed.data.respostas);
    } catch (error) {
      return HttpResponse.json(
        {
          error_code: "invalid_sus_answers",
          message: error instanceof Error ? error.message : "Erro ao calcular SUS.",
        },
        { status: 400 },
      );
    }

    const nomeHeader = request.headers.get("X-Actor-Name") ?? "Auditor sem identificação";
    const idHeader = request.headers.get("X-Actor-Id") ?? "mock-anon";
    const now = new Date();

    const avaliacao: SusAvaliacao = {
      id: `sus-${now.getFullYear()}-${String(susSeq).padStart(3, "0")}`,
      respondidoPor: nomeHeader,
      respondidoEm: now.toISOString(),
      respostas: parsed.data.respostas,
      score,
      comentario: parsed.data.comentario,
    };
    susAvaliacoesMutable.unshift(avaliacao);
    susSeq += 1;

    // Recalcula a média SUS e atualiza a meta de usabilidade.
    const novaMedia = computeSusMedia(susAvaliacoesMutable.map((s) => s.score));
    const idx = metasMutable.findIndex((m) => m.id === "meta-usabilidade");
    const currentMeta = idx >= 0 ? metasMutable[idx] : undefined;
    if (currentMeta) {
      const refreshed = refreshMeta(
        { ...currentMeta, atual: novaMedia, atualizadoEm: now.toISOString() },
        now,
      );
      metasMutable[idx] = refreshed;
    }
    ensureMetaRiskNotifications(now);

    pushAudit({
      timestamp: now.toISOString(),
      action: "meta.sus.registrada",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: "auditor",
      ipAddress: "10.20.30.11",
      resource: "meta:usabilidade",
      result: "sucesso",
      atypical: false,
      details: `Avaliação SUS registrada com score ${score}. Nova média: ${novaMedia}.`,
    });

    return respondValidated(SusSubmitResponseSchema, {
      avaliacao,
      novaMetaAtual: novaMedia,
    });
  }),

  http.get(`${API_URL}/analytics/sus`, () =>
    respondValidated(z.array(SusAvaliacaoSchema), susAvaliacoesMutable),
  ),

  http.post(`${API_URL}/analytics/reports/generate`, async ({ request }) => {
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "supervisor";
    if (atorPapel !== "supervisor" && atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Gestor e Administrador podem gerar relatórios gerenciais.",
        },
        { status: 403 },
      );
    }

    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = RelatorioGerencialRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_report_body",
          message: "Parâmetros do relatório inválidos.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;
    const now = new Date();
    const nomeArquivo = `${parsed.data.tipo}-${parsed.data.periodo.inicio.slice(0, 10)}-${parsed.data.periodo.fim.slice(0, 10)}.${parsed.data.formato}`;

    pushAudit({
      timestamp: now.toISOString(),
      action: "relatorio.gerencial.gerado",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: `relatorio:${parsed.data.tipo}`,
      result: "sucesso",
      atypical: false,
      correlationId: parsed.data.correlationId,
      details: `Relatório de ${parsed.data.tipo} (${parsed.data.formato.toUpperCase()}) para o período ${parsed.data.periodo.inicio} → ${parsed.data.periodo.fim}. Seções: ${parsed.data.secoes.join(", ")}.`,
    });

    return respondValidated(RelatorioGerencialResponseSchema, {
      filename: nomeArquivo,
      correlationId: parsed.data.correlationId,
      bytesMock: 4_096,
      emitidoEm: now.toISOString(),
    });
  }),

  // Módulo 6 — Governança (contrato legado — minimal)
  http.get(`${API_URL}/compliance/audit-log`, () =>
    respondValidated(z.array(AuditableActionSchema), auditLogFixture),
  ),

  // Módulo 6 — Trilha estendida (T19)
  http.get(`${API_URL}/compliance/audit-log-v2`, ({ request }) => {
    const url = new URL(request.url);
    const actor = url.searchParams.get("actor")?.toLowerCase();
    const action = url.searchParams.get("action")?.toLowerCase();
    const result = url.searchParams.get("result");
    const roleFilter = url.searchParams.get("role");
    const atypicalOnly = url.searchParams.get("atypical") === "true";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const q = url.searchParams.get("q")?.toLowerCase();

    const filtered = auditLogMutable.filter((entry) => {
      if (actor && !`${entry.actorId} ${entry.actorName}`.toLowerCase().includes(actor)) {
        return false;
      }
      if (action && !entry.action.toLowerCase().includes(action)) return false;
      if (result && entry.result !== result) return false;
      if (roleFilter && entry.actorRole !== roleFilter) return false;
      if (atypicalOnly && !entry.atypical) return false;
      if (from && entry.timestamp < from) return false;
      if (to && entry.timestamp > to) return false;
      if (q) {
        const haystack = [
          entry.id,
          entry.actorName,
          entry.actorId,
          entry.action,
          entry.resource,
          entry.ipAddress,
          entry.details,
          entry.dadosAcessados ?? "",
          entry.atypicalReason ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return respondValidated(z.array(AuditLogEntrySchema), filtered);
  }),

  http.post(`${API_URL}/compliance/audit-log-v2/export`, async ({ request }) => {
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";
    if (atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Admin pode exportar a trilha.",
        },
        { status: 403 },
      );
    }
    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;
    const bodyRaw = await request.json().catch(() => ({}));
    const body = z
      .object({
        format: z.enum(["csv", "json"]).default("csv"),
        total: z.number().int().min(0),
      })
      .safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_export_body",
          message: "Payload de export inválido.",
        },
        { status: 400 },
      );
    }

    const entry = pushAudit({
      timestamp: new Date().toISOString(),
      action: "trilha.export",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: "compliance:audit-log",
      result: "sucesso",
      atypical: false,
      details: `Export ${body.data.format.toUpperCase()} da trilha (${body.data.total} eventos) para órgão de controle.`,
    });

    return respondValidated(AuditLogEntrySchema, entry);
  }),

  http.get(`${API_URL}/compliance/atypical-accesses`, () => {
    const ordered = [...atypicalAccessesMutable].sort((a, b) =>
      a.detectedAt < b.detectedAt ? 1 : -1,
    );
    return respondValidated(z.array(AtypicalAccessSchema), ordered);
  }),

  http.post(`${API_URL}/compliance/atypical-accesses/:id/block`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";
    if (atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Admin pode bloquear acessos.",
        },
        { status: 403 },
      );
    }

    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = BlockAtypicalRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_block_body",
          message: "Justificativa inválida.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const idx = atypicalAccessesMutable.findIndex((a) => a.id === id);
    const current = idx >= 0 ? atypicalAccessesMutable[idx] : undefined;
    if (!current || idx < 0) {
      return HttpResponse.json(
        {
          error_code: "atypical_not_found",
          message: "Acesso atípico não encontrado.",
        },
        { status: 404 },
      );
    }

    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;
    const now = new Date().toISOString();
    const updated: AtypicalAccess = {
      ...current,
      blocked: true,
      blockedBy: `${nomeHeader} (${ROLE_DISPLAY[atorPapel]})`,
      blockedAt: now,
    };
    atypicalAccessesMutable[idx] = updated;

    pushAudit({
      timestamp: now,
      action: "atypical.bloqueado",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: `atypical:${id}`,
      result: "sucesso",
      atypical: false,
      details: `Acesso atípico ${id} bloqueado. Justificativa: ${parsed.data.justificativa}`,
    });

    return respondValidated(AtypicalAccessSchema, updated);
  }),

  http.get(`${API_URL}/compliance/seals`, () =>
    respondValidated(z.array(ComplianceSealSchema), complianceSealsFixture),
  ),

  // Módulo 6 — Cadastro operacional de usuários (T19, admin only)
  http.get(`${API_URL}/users`, () =>
    respondValidated(z.array(SystemUserSchema), systemUsersMutable),
  ),

  http.post(`${API_URL}/users`, async ({ request }) => {
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";
    if (atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Admin pode criar usuários.",
        },
        { status: 403 },
      );
    }
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = UserCreateRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_user_body",
          message: "Dados do usuário inválidos.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    if (systemUsersMutable.some((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())) {
      return HttpResponse.json(
        { error_code: "user_email_conflict", message: "E-mail já cadastrado." },
        { status: 409 },
      );
    }
    if (systemUsersMutable.some((u) => u.matricula === parsed.data.matricula)) {
      return HttpResponse.json(
        {
          error_code: "user_matricula_conflict",
          message: "Matrícula já cadastrada.",
        },
        { status: 409 },
      );
    }

    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;
    const now = new Date().toISOString();
    const newId = `u-${String(userSeq).padStart(3, "0")}`;
    userSeq += 1;

    const created: SystemUser = {
      id: newId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      matricula: parsed.data.matricula,
      role: parsed.data.role,
      status: "ativo",
      mfaHabilitado: parsed.data.mfaHabilitado,
      criadoEm: now,
      observacoes: parsed.data.observacoes,
    };
    systemUsersMutable.unshift(created);

    pushAudit({
      timestamp: now,
      action: "usuario.criado",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: `usuario:${newId}`,
      result: "sucesso",
      atypical: false,
      details: `Novo usuário criado (${created.nome}) com papel '${created.role}' e MFA ${created.mfaHabilitado ? "habilitado" : "desabilitado"}.`,
      dadosAcessados: `Servidor ${created.nome} (matrícula ${created.matricula}).`,
    });

    return respondValidated(SystemUserSchema, created);
  }),

  http.patch(`${API_URL}/users/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";
    if (atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Admin pode editar usuários.",
        },
        { status: 403 },
      );
    }
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = UserUpdateRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_user_body",
          message: "Dados do usuário inválidos.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const idx = systemUsersMutable.findIndex((u) => u.id === id);
    const current = idx >= 0 ? systemUsersMutable[idx] : undefined;
    if (!current || idx < 0) {
      return HttpResponse.json(
        { error_code: "user_not_found", message: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    const changed: string[] = [];
    for (const key of Object.keys(parsed.data) as (keyof typeof parsed.data)[]) {
      const nextValue = parsed.data[key];
      if (nextValue !== undefined && nextValue !== current[key]) {
        changed.push(key);
      }
    }

    const updated: SystemUser = {
      ...current,
      ...parsed.data,
    };
    systemUsersMutable[idx] = updated;

    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;
    const now = new Date().toISOString();

    pushAudit({
      timestamp: now,
      action: "usuario.editado",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: `usuario:${id}`,
      result: "sucesso",
      atypical: false,
      details: `Usuário ${current.nome} atualizado — campos alterados: ${changed.join(", ") || "nenhum"}.`,
      dadosAcessados: `Servidor ${current.nome} (matrícula ${current.matricula}).`,
    });

    return respondValidated(SystemUserSchema, updated);
  }),

  http.post(`${API_URL}/users/:id/deactivate`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const roleHeader = request.headers.get("X-Actor-Role");
    const roleParsed = RoleSchema.safeParse(roleHeader);
    const atorPapel: Role = roleParsed.success ? roleParsed.data : "auditor";
    if (atorPapel !== "admin") {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Apenas Admin pode desativar usuários.",
        },
        { status: 403 },
      );
    }

    const idx = systemUsersMutable.findIndex((u) => u.id === id);
    const current = idx >= 0 ? systemUsersMutable[idx] : undefined;
    if (!current || idx < 0) {
      return HttpResponse.json(
        { error_code: "user_not_found", message: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    const updated: SystemUser = { ...current, status: "inativo" };
    systemUsersMutable[idx] = updated;

    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;

    pushAudit({
      timestamp: new Date().toISOString(),
      action: "usuario.inativado",
      actorId: idHeader,
      actorName: nomeHeader,
      actorRole: atorPapel,
      ipAddress: "10.20.30.11",
      resource: `usuario:${id}`,
      result: "sucesso",
      atypical: false,
      details: `Usuário ${current.nome} marcado como inativo (histórico preservado — cadeia de custódia).`,
    });

    return respondValidated(SystemUserSchema, updated);
  }),

  // Perfil e preferências do usuário (T27 · Transversal)
  http.get(`${API_URL}/me`, ({ request }) => {
    const url = new URL(request.url);
    const roleParsed = RoleSchema.safeParse(url.searchParams.get("role"));
    if (!roleParsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_role",
          message: "Informe um papel válido para carregar o perfil.",
        },
        { status: 400 },
      );
    }
    const role = roleParsed.data;
    return respondValidated(UserProfileSchema, {
      ...userProfilesFixture[role],
      ...(role === "cidadao" ? { dadosCadastrais: citizenRegistrationMutable } : {}),
      preferencias: getPreferencesForRole(role),
    });
  }),

  http.put(`${API_URL}/me/registration`, async ({ request }) => {
    if (!citizenRegistrationMutable) {
      return HttpResponse.json(
        {
          error_code: "registration_not_found",
          message: "Cadastro do contribuinte não encontrado.",
        },
        { status: 404 },
      );
    }
    const bodyRaw = await request.json().catch(() => null);
    const body = CitizenRegistrationUpdateRequestSchema.safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_registration_body",
          message: "Não foi possível salvar seus dados. Revise os campos e tente novamente.",
          issues: body.error.issues,
        },
        { status: 400 },
      );
    }
    // Só contato/endereço mudam por aqui; CPF e vínculos societários
    // exigem via formal (Junta Comercial / atendimento da Prefeitura).
    Object.assign(citizenRegistrationMutable, body.data, {
      atualizadoEm: new Date().toISOString(),
    });
    return respondValidated(CitizenRegistrationSchema, citizenRegistrationMutable);
  }),

  http.put(`${API_URL}/me/preferences`, async ({ request }) => {
    const bodyRaw = await request.json().catch(() => null);
    const body = PreferencesUpdateRequestSchema.safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_preferences_body",
          message: "Não foi possível salvar as preferências. Verifique os dados enviados.",
          issues: body.error.issues,
        },
        { status: 400 },
      );
    }
    const { role, preferencias } = body.data;
    const updated: UserPreferences = {
      ...getPreferencesForRole(role),
      ...preferencias,
    };
    userPreferencesByRole.set(role, updated);
    return respondValidated(UserProfileSchema.shape.preferencias, updated);
  }),

  // Ambiente de treinamento (T20 · RSC04 · módulo 6)
  http.get(`${API_URL}/training/cases`, () => {
    /*
      O gabarito (decisão histórica + aprendizado) NUNCA sai na lista —
      só é revelado após a tentativa, senão o exercício perde o valor.
    */
    const cases = trainingCasesFixture.map(({ gabarito: _g, aprendizado: _a, ...publicCase }) => ({
      ...publicCase,
      tentativa: trainingAttempts.get(publicCase.id),
    }));
    return respondValidated(z.array(TrainingCaseSchema), cases);
  }),

  http.post(`${API_URL}/training/cases/:id/attempt`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const exercise = trainingCasesFixture.find((c) => c.id === id);
    if (!exercise) {
      return HttpResponse.json(
        {
          error_code: "training_case_not_found",
          message: "Exercício não encontrado.",
        },
        { status: 404 },
      );
    }
    if (trainingAttempts.has(id)) {
      return HttpResponse.json(
        {
          error_code: "training_already_attempted",
          message: "Você já concluiu este exercício. Reveja o gabarito na biblioteca.",
        },
        { status: 409 },
      );
    }
    const bodyRaw = await request.json().catch(() => null);
    const body = TrainingAttemptRequestSchema.safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_training_attempt",
          message: "Justifique sua decisão com pelo menos 20 caracteres — faz parte do exercício.",
          issues: body.error.issues,
        },
        { status: 400 },
      );
    }
    const result: TrainingAttemptResult = {
      casoId: id,
      acertou: body.data.acao === exercise.gabarito.acao,
      suaDecisao: {
        acao: body.data.acao,
        justificativa: body.data.justificativa,
      },
      gabarito: exercise.gabarito,
      aprendizado: exercise.aprendizado,
      tentadoEm: new Date().toISOString(),
    };
    trainingAttempts.set(id, result);
    return respondValidated(TrainingAttemptResultSchema, result);
  }),

  // Módulo 7 — Geofiscalização (T21 · complementar)
  // Pins ordenados por severidade do indício (desc) — mesma priorização
  // visual que o auditor vê no mapa.
  http.get(`${API_URL}/support/geofiscalizacao/obras`, () =>
    respondValidated(
      z.array(GeoObraSchema),
      [...geoObrasMutable].sort((a, b) => b.severidade - a.severidade),
    ),
  ),

  /*
    "Gerar caso" — abre caso candidato real na fila do módulo 4 a partir
    do indício de obra. A UI exige confirmação do auditor; aqui o efeito
    é idempotente: segunda tentativa devolve 409 com o caso já aberto.
  */
  http.post(`${API_URL}/support/geofiscalizacao/obras/:id/open-case`, ({ params }) => {
    const { id } = params as { id: string };
    const obra = geoObrasMutable.find((o) => o.id === id);
    if (!obra) {
      return HttpResponse.json(
        {
          error_code: "geo_obra_not_found",
          message: "Obra ou imóvel com indício não encontrado.",
        },
        { status: 404 },
      );
    }
    if (obra.status === "caso_aberto") {
      return HttpResponse.json(
        {
          error_code: "geo_case_already_open",
          message: "Já existe caso candidato aberto para esta obra.",
          casoId: obra.casoId,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const divergenciaEstimada = Math.max(0, obra.valorEstimadoObra - obra.nfseConstrucao12m);
    const ALVARA_LABEL: Record<GeoObra["alvara"]["situacao"], string> = {
      sem_alvara: "sem alvará localizado",
      alvara_divergente: "alvará divergente da intervenção detectada",
      alvara_compativel: "alvará compatível, serviços subdeclarados",
    };
    const caso: Caso = {
      id: `cs-2026-g${String(geoCaseSeq).padStart(3, "0")}`,
      contribuinteId: obra.contribuinteId,
      status: "candidato",
      criadoEm: now,
      atualizadoEm: now,
      agenteResponsavel: "ag-orquestrador",
      divergenciaIds: [],
      valorPotencial: divergenciaEstimada,
      periodoApuracao: "últimos 12 meses",
      tributo: "iss",
      proximaAcaoRecomendada: `Verificar obra em ${obra.endereco} (${obra.bairro}) — ${ALVARA_LABEL[obra.alvara.situacao]}.`,
      recomendacao: {
        // Sem alvará = irregularidade formal já caracterizada → verificação
        // in loco; nos demais, o convite à autorregularização vem primeiro.
        acao: obra.alvara.situacao === "sem_alvara" ? "fiscalizacao" : "autorregularizacao",
        justificativa: `Detecção por visão computacional (${obra.deteccao.fonte === "satelite" ? "satélite" : "imagens de rua"}): ${obra.deteccao.resumo} Situação do licenciamento: ${ALVARA_LABEL[obra.alvara.situacao]}.`,
        confianca: obra.deteccao.confianca,
        baseadaEm: [obra.id],
      },
      observacoes: `Caso aberto a partir da Geofiscalização (T21). Área detectada: ${obra.deteccao.areaDetectadaM2} m²; NFS-e de construção (12m): R$ ${Math.round(obra.nfseConstrucao12m / 1000)} mil.`,
    };
    geoCaseSeq += 1;
    casosMutable.unshift(caso);

    obra.status = "caso_aberto";
    obra.casoId = caso.id;

    return respondValidated(
      z.object({ obra: GeoObraSchema, caso: CasoSchema }),
      { obra, caso },
      { status: 201 },
    );
  }),

  // Notificações in-app
  http.get(`${API_URL}/notifications`, () =>
    respondValidated(z.array(NotificacaoSchema), notificacoesMutable),
  ),

  http.post(`${API_URL}/notifications/:id/read`, ({ params }) => {
    const { id } = params as { id: string };
    const idx = notificacoesMutable.findIndex((n) => n.id === id);
    const current = idx >= 0 ? notificacoesMutable[idx] : undefined;
    if (!current) {
      return HttpResponse.json(
        {
          error_code: "notification_not_found",
          message: "Notificação não encontrada.",
        },
        { status: 404 },
      );
    }
    const updated = {
      ...current,
      lida: true,
      lidaEm: new Date().toISOString(),
    };
    notificacoesMutable[idx] = updated;
    return respondValidated(NotificacaoSchema, updated);
  }),

  // Auth mock — não valida senha, apenas devolve o papel escolhido
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const bodyRaw = await request.json().catch(() => ({}));
    const body = LoginRequestSchema.safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_credentials_body",
          message: "Corpo da requisição inválido.",
          issues: body.error.issues,
        },
        { status: 400 },
      );
    }
    const role = body.data.role ?? "auditor";
    const profile = userProfilesFixture[role];
    return respondValidated(LoginResponseSchema, {
      role,
      mockUser: {
        id: profile.id,
        displayName: profile.nome,
      },
      issuedAt: new Date().toISOString(),
    });
  }),

  // Transversal — Busca global (T24): CNPJ, caso e contribuinte
  http.get(`${API_URL}/search`, ({ request }) => {
    const atorPapel = readActorRole(request);
    if (!isInternalRole(atorPapel)) {
      return HttpResponse.json(
        {
          error_code: "forbidden_role",
          message: "Busca global disponível apenas para perfis internos.",
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    if (!q) {
      return respondValidated(z.array(SearchResultSchema), []);
    }

    const scoreByContribuinte = new Map(scoresFixture.map((s) => [s.contribuinteId, s]));
    const casoMaisRecentePorContribuinte = new Map<string, Caso>();
    for (const caso of casosMutable) {
      const atual = casoMaisRecentePorContribuinte.get(caso.contribuinteId);
      if (!atual || caso.atualizadoEm > atual.atualizadoEm) {
        casoMaisRecentePorContribuinte.set(caso.contribuinteId, caso);
      }
    }

    const resultados: SearchResult[] = [];

    for (const contribuinte of contribuintesFixture) {
      const nomeMatch = `${contribuinte.razaoSocial} ${contribuinte.nomeFantasia ?? ""}`
        .toLowerCase()
        .includes(q);
      const identificadorMatch =
        `${contribuinte.cnpjMascarado} ${contribuinte.inscricaoMunicipal ?? ""}`
          .toLowerCase()
          .includes(q);
      if (!nomeMatch && !identificadorMatch) continue;

      const score = scoreByContribuinte.get(contribuinte.id);
      const casoRelacionado = casoMaisRecentePorContribuinte.get(contribuinte.id);

      resultados.push({
        tipo: identificadorMatch && !nomeMatch ? "cnpj" : "contribuinte",
        id: contribuinte.id,
        titulo: contribuinte.razaoSocial,
        subtitulo: contribuinte.nomeFantasia
          ? `${contribuinte.nomeFantasia} · ${contribuinte.cnpjMascarado}`
          : contribuinte.cnpjMascarado,
        scoreValor: score?.valor,
        nivelRisco: score?.nivel,
        casoRelacionadoId: casoRelacionado?.id,
      });
    }

    for (const caso of casosMutable) {
      const contribuinte = contribuintesFixture.find((c) => c.id === caso.contribuinteId);
      const haystack = [caso.id, caso.tributo ?? "", caso.status, contribuinte?.razaoSocial ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) continue;

      resultados.push({
        tipo: "caso",
        id: caso.id,
        titulo: caso.id.toUpperCase(),
        subtitulo: contribuinte?.razaoSocial,
        scoreValor: caso.scoreValor,
        status: caso.status,
        casoRelacionadoId: caso.id,
      });
    }

    return respondValidated(z.array(SearchResultSchema), resultados.slice(0, 20));
  }),

  // Módulo 6 — Copilot Fiscal (T18, RF10/FA11).
  // Aberto a todos os perfis autenticados (inclusive cidadão): o Copilot
  // só consulta/orienta, nunca executa ação nem expõe dado de terceiros —
  // as respostas contextuais de caso continuam vindo do dossiê que o
  // próprio perfil já pode ver.
  http.post(`${API_URL}/copilot/ask`, async ({ request }) => {
    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = CopilotAskRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_copilot_request",
          message: "Pergunta inválida.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { pergunta, contextoCasoId } = parsed.data;
    const perguntaNormalizada = pergunta.toLowerCase();
    const now = new Date().toISOString();

    /*
      Resposta contextual: quando o Copilot é aberto a partir do chip
      "Contexto: CS-..." do Dossiê e a pergunta pede um resumo, monta a
      resposta com dados reais do caso mutável (reflete decisões já
      tomadas), em vez de usar um roteiro estático.
    */
    const pedeResumoContextual = /resum|este caso|esse caso|status (do|deste) caso/.test(
      perguntaNormalizada,
    );
    if (contextoCasoId && pedeResumoContextual) {
      const caso = casosMutable.find((c) => c.id === contextoCasoId.toLowerCase());
      if (caso) {
        const contribuinte = contribuintesFixture.find((c) => c.id === caso.contribuinteId);
        const texto = `O caso ${caso.id.toUpperCase()} (${contribuinte?.razaoSocial ?? caso.contribuinteId}) está em "${caso.status}", com score ${caso.scoreValor ?? "não calculado"} e ${caso.divergenciaIds.length} divergência(s) vinculada(s).${caso.recomendacao ? ` Recomendação do agente: ${caso.recomendacao.justificativa}` : ""}`;
        return respondValidated(CopilotAskResponseSchema, {
          mensagem: {
            id: `cpm-${Date.now()}`,
            autor: "copilot",
            texto,
            fontes: [{ label: `Dossiê ${caso.id.toUpperCase()}` }],
            timestamp: now,
          },
        });
      }
    }

    const script = copilotScriptsFixture.find((s) =>
      s.gatilhos.some((gatilho) => perguntaNormalizada.includes(gatilho)),
    );

    return respondValidated(CopilotAskResponseSchema, {
      mensagem: {
        id: `cpm-${Date.now()}`,
        autor: "copilot",
        texto: script?.resposta ?? COPILOT_FALLBACK_RESPOSTA,
        fontes: script?.fontes ?? [],
        timestamp: now,
      },
      sugestoes: script ? undefined : COPILOT_SUGESTOES_PADRAO,
    });
  }),
];
