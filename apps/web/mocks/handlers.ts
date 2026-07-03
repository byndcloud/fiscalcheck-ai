import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  AgenteSchema,
  AuditableActionSchema,
  type CaseDecision,
  CaseDecisionSchema,
  type CaseDocument,
  CaseDocumentSchema,
  type Caso,
  CasoSchema,
  ContribuinteSchema,
  DecisionRequestSchema,
  DivergenciaSchema,
  MonthlyRecoverySeriesSchema,
  type Notificacao,
  NotificacaoSchema,
  PanelKpisSchema,
  RiskDistributionSchema,
  type Role,
  RoleSchema,
  ScoreSchema,
  SmartAlertSchema,
} from "@fiscalcheck/shared-types";

import { nextStatus, shouldEmitDocument } from "@/lib/case-transitions";

import { agentesFixture } from "./fixtures/agentes";
import { ArquivoIngeridoSchema, arquivosFixture } from "./fixtures/arquivos";
import { auditLogFixture } from "./fixtures/audit-log";
import { caseDecisionsFixture } from "./fixtures/case-decisions";
import { caseDocumentsFixture } from "./fixtures/case-documents";
import { casosFixture } from "./fixtures/casos";
import { contribuintesFixture } from "./fixtures/contribuintes";
import { divergenciasFixture } from "./fixtures/divergencias";
import { KPIsAnalyticsSchema, kpisFixture } from "./fixtures/kpis";
import { monthlyRecoveryFixture } from "./fixtures/monthly-recovery";
import { notificacoesFixture } from "./fixtures/notificacoes";
import { panelKpisFixture } from "./fixtures/panel-kpis";
import { riskDistributionFixture } from "./fixtures/risk-distribution";
import { scoresFixture } from "./fixtures/scores";
import { smartAlertsFixture } from "./fixtures/smart-alerts";

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

  // Módulo 6 — Governança
  http.get(`${API_URL}/compliance/audit-log`, () =>
    respondValidated(z.array(AuditableActionSchema), auditLogFixture),
  ),

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
