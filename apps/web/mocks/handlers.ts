import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  AgenteSchema,
  AuditableActionSchema,
  CasoSchema,
  DivergenciaSchema,
  IngestionAgentEventSchema,
  IngestionLoadSchema,
  IntegrationSourceSchema,
  MonthlyRecoverySeriesSchema,
  type Notificacao,
  NotificacaoSchema,
  PanelKpisSchema,
  RiskDistributionSchema,
  RoleSchema,
  ScoreSchema,
  SimulateFailurePayloadSchema,
  SmartAlertSchema,
} from "@fiscalcheck/shared-types";

import { agentesFixture } from "./fixtures/agentes";
import { auditLogFixture } from "./fixtures/audit-log";
import { casosFixture } from "./fixtures/casos";
import { divergenciasFixture } from "./fixtures/divergencias";
import { ingestionAgentEventsFixture } from "./fixtures/ingestion-agent-events";
import { ingestionLoadsFixture } from "./fixtures/ingestion-loads";
import { integrationSourcesFixture } from "./fixtures/integration-sources";
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
  // Módulo 1 — Integrações e Ingestão
  http.get(`${API_URL}/ingestion/sources`, () =>
    respondValidated(z.array(IntegrationSourceSchema), integrationSourcesFixture),
  ),
  http.get(`${API_URL}/ingestion/agent-events`, () =>
    respondValidated(z.array(IngestionAgentEventSchema), ingestionAgentEventsFixture),
  ),
  http.get(`${API_URL}/ingestion/loads`, () =>
    respondValidated(z.array(IngestionLoadSchema), ingestionLoadsFixture),
  ),
  http.post(`${API_URL}/ingestion/simulate-failure`, async ({ request }) => {
    const bodyRaw = await request.json().catch(() => ({}));
    const body = SimulateFailurePayloadSchema.safeParse(bodyRaw);
    if (!body.success) {
      return HttpResponse.json(
        {
          error_code: "invalid_simulate_failure_body",
          message: "Informe o `sourceId` da fonte que deve simular a falha.",
          issues: body.error.issues,
        },
        { status: 400 },
      );
    }
    const source = integrationSourcesFixture.find((s) => s.id === body.data.sourceId);
    const nome = source?.nome ?? "Fonte desconhecida";
    const nova: Notificacao = {
      id: `nt-ing-${Date.now()}`,
      tipo: "ingestao_falha",
      titulo: `Falha crítica na ingestão · ${nome}`,
      corpo: `O conector ${nome} sinalizou falha crítica na última tentativa de carga. Revise o pipeline e reprocesse quando saudável.`,
      severidade: 5,
      criadoEm: new Date().toISOString(),
      lida: false,
    };
    notificacoesMutable.unshift(nova);
    return respondValidated(NotificacaoSchema, nova);
  }),

  // Módulo 2 — Cruzamento
  http.get(`${API_URL}/crossing/divergences`, () =>
    respondValidated(z.array(DivergenciaSchema), divergenciasFixture),
  ),

  // Módulo 3 — IA Preditiva
  http.get(`${API_URL}/ai/scores`, () => respondValidated(z.array(ScoreSchema), scoresFixture)),
  http.get(`${API_URL}/ai/agents`, () => respondValidated(z.array(AgenteSchema), agentesFixture)),

  // Módulo 4 — Casos
  http.get(`${API_URL}/cases`, () => respondValidated(z.array(CasoSchema), casosFixture)),

  // Portal do cidadão — subconjunto dos casos
  http.get(`${API_URL}/citizen/cases`, () => {
    const meus = casosFixture.filter((caso) => ["ct-002", "ct-003"].includes(caso.contribuinteId));
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
