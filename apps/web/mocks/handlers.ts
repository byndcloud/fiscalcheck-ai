import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  AgenteSchema,
  type AtypicalAccess,
  AtypicalAccessSchema,
  type AuditLogEntry,
  AuditLogEntrySchema,
  AuditableActionSchema,
  BlockAtypicalRequestSchema,
  type CaseDecision,
  CaseDecisionSchema,
  type CaseDocument,
  CaseDocumentSchema,
  type Caso,
  CasoSchema,
  ComplianceSealSchema,
  ComunicacaoSchema,
  ContribuinteSchema,
  DecisionRequestSchema,
  DivergenciaSchema,
  MonthlyRecoverySeriesSchema,
  type Notificacao,
  NotificacaoSchema,
  PanelKpisSchema,
  RiskDistributionSchema,
  type RiskModelChange,
  RiskModelChangeSchema,
  type RiskModelConfig,
  RiskModelConfigSchema,
  RiskModelPublishRequestSchema,
  RiskModelPublishResponseSchema,
  type Role,
  RoleSchema,
  ScoreSchema,
  SmartAlertSchema,
  type SystemUser,
  SystemUserSchema,
  UserCreateRequestSchema,
  UserUpdateRequestSchema,
} from "@fiscalcheck/shared-types";

import { nextStatus, shouldEmitDocument } from "@/lib/case-transitions";

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
import { contribuintesFixture } from "./fixtures/contribuintes";
import { divergenciasFixture } from "./fixtures/divergencias";
import { KPIsAnalyticsSchema, kpisFixture } from "./fixtures/kpis";
import { monthlyRecoveryFixture } from "./fixtures/monthly-recovery";
import { notificacoesFixture } from "./fixtures/notificacoes";
import { panelKpisFixture } from "./fixtures/panel-kpis";
import { riskDistributionFixture } from "./fixtures/risk-distribution";
import { riskModelConfigFixture, riskModelHistoryFixture } from "./fixtures/risk-model";
import { scoresFixture } from "./fixtures/scores";
import { smartAlertsFixture } from "./fixtures/smart-alerts";
import { systemUsersFixture } from "./fixtures/system-users";

/*
  Handlers MSW — 1 endpoint por módulo funcional.
  Cada handler valida a saída contra um schema Zod antes de responder:
  isso protege o front do drift entre fixtures e contratos.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const notificacoesMutable = [...notificacoesFixture];

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
const systemUsersMutable: SystemUser[] = systemUsersFixture.map((u) => ({ ...u }));

let auditLogSeq = auditLogMutable.length + 100;
let userSeq = systemUsersMutable.length + 100;

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

function respondValidated<T>(schema: z.ZodType<T>, payload: unknown): Response {
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
  return HttpResponse.json(parsed.data as never);
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

  // Módulo 3 — IA Preditiva
  http.get(`${API_URL}/ai/scores`, () => respondValidated(z.array(ScoreSchema), scoresFixture)),
  http.get(`${API_URL}/ai/agents`, () => respondValidated(z.array(AgenteSchema), agentesFixture)),

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
        { error_code: "taxpayer_not_found", message: "Contribuinte não encontrado." },
        { status: 404 },
      );
    }
    return respondValidated(ContribuinteSchema, found);
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

  // Módulo 4 — Central de Notificações Eletrônicas (T15)
  http.get(`${API_URL}/communications`, () =>
    respondValidated(z.array(ComunicacaoSchema), comunicacoesFixture),
  ),
  http.get(`${API_URL}/communications/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = comunicacoesFixture.find((c) => c.id === id);
    if (!found) {
      return HttpResponse.json(
        { error_code: "communication_not_found", message: "Comunicação não encontrada." },
        { status: 404 },
      );
    }
    return respondValidated(ComunicacaoSchema, found);
  }),

  // Portal do cidadão — subconjunto dos casos
  http.get(`${API_URL}/citizen/cases`, () => {
    const meus = casosMutable.filter((caso) => ["ct-002", "ct-003"].includes(caso.contribuinteId));
    return respondValidated(z.array(CasoSchema), meus);
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
        { error_code: "forbidden_role", message: "Apenas Admin pode exportar a trilha." },
        { status: 403 },
      );
    }
    const nomeHeader = request.headers.get("X-Actor-Name") ?? ROLE_DISPLAY[atorPapel];
    const idHeader = request.headers.get("X-Actor-Id") ?? `mock-${atorPapel}`;
    const bodyRaw = await request.json().catch(() => ({}));
    const body = z
      .object({ format: z.enum(["csv", "json"]).default("csv"), total: z.number().int().min(0) })
      .safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        { error_code: "invalid_export_body", message: "Payload de export inválido." },
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
        { error_code: "forbidden_role", message: "Apenas Admin pode bloquear acessos." },
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
        { error_code: "atypical_not_found", message: "Acesso atípico não encontrado." },
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
        { error_code: "forbidden_role", message: "Apenas Admin pode criar usuários." },
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
        { error_code: "user_matricula_conflict", message: "Matrícula já cadastrada." },
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
        { error_code: "forbidden_role", message: "Apenas Admin pode editar usuários." },
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
        { error_code: "forbidden_role", message: "Apenas Admin pode desativar usuários." },
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
    return respondValidated(LoginResponseSchema, {
      role,
      mockUser: {
        id: `mock-${role}`,
        displayName: `Usuário mock (${role})`,
      },
      issuedAt: new Date().toISOString(),
    });
  }),
];
