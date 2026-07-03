import type { SystemUser } from "@fiscalcheck/shared-types";

/*
  Cadastro operacional de usuários (T19 · módulo 6).

  8 servidores sintéticos cobrindo os 3 papéis internos (auditor,
  supervisor, admin) + 2 papéis não-humanos (cidadão de exemplo e
  agente do sistema) que existem para demonstrar que o cadastro os
  contempla, ainda que não sejam criados via CRUD comum.

  MFA está habilitado em todos os papéis internos (regra do edital).
  `status = inativo` demonstra que a plataforma preserva o histórico
  em vez de apagar o usuário (AGENTS.md §1.1 — cadeia de custódia).
*/

export const systemUsersFixture: SystemUser[] = [
  {
    id: "u-001",
    nome: "Rafael Neves",
    email: "rafael.neves@brusque.sc.gov.br",
    matricula: "12045",
    role: "admin",
    status: "ativo",
    mfaHabilitado: true,
    criadoEm: "2025-11-04T13:00:00Z",
    ultimoAcesso: "2026-07-03T18:32:11Z",
    observacoes: "Administrador do console — responsável pelo RIPD.",
  },
  {
    id: "u-002",
    nome: "Ana Beltrão",
    email: "ana.beltrao@brusque.sc.gov.br",
    matricula: "13887",
    role: "supervisor",
    status: "ativo",
    mfaHabilitado: true,
    criadoEm: "2025-11-04T13:04:00Z",
    ultimoAcesso: "2026-07-03T18:14:07Z",
    observacoes: "Gestora da equipe de fiscalização mobiliária.",
  },
  {
    id: "u-003",
    nome: "Marina Steiner",
    email: "marina.steiner@brusque.sc.gov.br",
    matricula: "22114",
    role: "auditor",
    status: "ativo",
    mfaHabilitado: true,
    criadoEm: "2025-12-02T10:12:00Z",
    ultimoAcesso: "2026-07-03T17:58:44Z",
  },
  {
    id: "u-004",
    nome: "Julia Ferraz",
    email: "julia.ferraz@brusque.sc.gov.br",
    matricula: "22447",
    role: "auditor",
    status: "suspenso",
    mfaHabilitado: true,
    criadoEm: "2025-12-15T09:20:00Z",
    ultimoAcesso: "2026-07-03T02:41:07Z",
    observacoes: "Suspensa preventivamente após detecção de acessos atípicos (T19).",
  },
  {
    id: "u-005",
    nome: "Débora Lopes",
    email: "debora.lopes@brusque.sc.gov.br",
    matricula: "41029",
    role: "supervisor",
    status: "ativo",
    mfaHabilitado: true,
    criadoEm: "2026-01-10T09:00:00Z",
    ultimoAcesso: "2026-07-02T19:12:00Z",
    observacoes: "Promovida de auditor para supervisor em 2026-07-02.",
  },
  {
    id: "u-006",
    nome: "Roberto Kunz",
    email: "roberto.kunz@brusque.sc.gov.br",
    matricula: "30988",
    role: "auditor",
    status: "ativo",
    mfaHabilitado: true,
    criadoEm: "2026-02-18T11:22:00Z",
    ultimoAcesso: "2026-07-01T16:44:00Z",
  },
  {
    id: "u-007",
    nome: "Camila Ribeiro",
    email: "camila.ribeiro@brusque.sc.gov.br",
    matricula: "30112",
    role: "auditor",
    status: "inativo",
    mfaHabilitado: false,
    criadoEm: "2024-06-01T09:00:00Z",
    ultimoAcesso: "2025-11-18T15:03:00Z",
    observacoes: "Aposentada em 2025-12-30 — inativa preservada por histórico.",
  },
  {
    id: "u-008",
    nome: "Marcos Toffoli",
    email: "marcos.toffoli@brusque.sc.gov.br",
    matricula: "88231",
    role: "auditor",
    status: "ativo",
    mfaHabilitado: true,
    criadoEm: "2026-07-03T14:02:55Z",
    observacoes: "Recém-admitido — aguardando primeiro login.",
  },
];
