import type { ComplianceSeal } from "@fiscalcheck/shared-types";

/*
  Selos de conformidade (T19 · módulo 6) — 9 controles do edital.

  A ordem aqui é a que a UI usa por padrão; o `status` ordinal (ok <
  atencao < pendente) permite reordenar por criticidade quando o
  usuário quiser. RS08 traz `incidenteAbertoEm` para alimentar o
  countdown de 24h; os demais usam apenas `evidencia` +
  `ultimaVerificacao` + `proximaRevisao`.
*/

const HOJE = "2026-07-03T12:00:00Z";

export const complianceSealsFixture: ComplianceSeal[] = [
  {
    code: "tls_aes256",
    titulo: "TLS 1.3 + AES-256 em repouso",
    descricao:
      "Tráfego externo somente por TLS 1.3; dados em repouso cifrados com AES-256 (KMS gerenciado).",
    status: "ok",
    evidencia: "Certificado ECDSA-P384 emitido pela ICP-Brasil; rotação em 90 dias.",
    ultimaVerificacao: HOJE,
    proximaRevisao: "2026-10-01T00:00:00Z",
  },
  {
    code: "mfa",
    titulo: "MFA obrigatório para papéis internos",
    descricao: "Auditor, Supervisor e Admin exigem TOTP no login e step-up MFA em ações sensíveis.",
    status: "ok",
    evidencia: "8 de 8 servidores ativos com MFA habilitado.",
    ultimaVerificacao: HOJE,
  },
  {
    code: "segregacao",
    titulo: "Segregação de funções (RBAC)",
    descricao:
      "Papéis com menor privilégio; agente não decide; efeito jurídico exige Admin/Supervisor.",
    status: "ok",
    evidencia: "3 tentativas de acesso cruzado bloqueadas nas últimas 24h.",
    ultimaVerificacao: HOJE,
  },
  {
    code: "pseudonimizacao",
    titulo: "Pseudonimização antes de LLM externo",
    descricao:
      "CPF/CNPJ e razão social substituídos por hashes com salt antes de qualquer envio ao Copilot.",
    status: "ok",
    evidencia: "Auditoria de payloads dos últimos 30 dias — 0 vazamentos detectados.",
    ultimaVerificacao: HOJE,
  },
  {
    code: "lgpd_ctn",
    titulo: "LGPD + Sigilo fiscal (art. 198 CTN)",
    descricao:
      "Base legal por finalidade fiscal; consentimento gov.br para dados do cidadão; base 198 CTN entre Fisco e servidor.",
    status: "ok",
    evidencia: "RIPD assinado em 2026-04-11; DPO ciente das atualizações do T02.",
    ultimaVerificacao: HOJE,
    proximaRevisao: "2026-10-11T00:00:00Z",
  },
  {
    code: "ripd",
    titulo: "Apoio ao RIPD",
    descricao:
      "Diagnóstico automatizado do tratamento de dados sensíveis; export em PDF pré-assinado.",
    status: "atencao",
    evidencia:
      "Última seção 'Compartilhamento com órgãos de controle' pendente de revisão jurídica.",
    ultimaVerificacao: HOJE,
    proximaRevisao: "2026-07-15T00:00:00Z",
  },
  {
    code: "rs04_pentest",
    titulo: "RS04 — Pentest anual",
    descricao: "Teste de invasão contratado a terceiros com escopo de aplicação + infraestrutura.",
    status: "ok",
    evidencia: "Relatório 2026-Q1 — nenhuma vulnerabilidade crítica em aberto.",
    ultimaVerificacao: "2026-03-22T00:00:00Z",
    proximaRevisao: "2027-03-22T00:00:00Z",
  },
  {
    code: "rs09_retencao",
    titulo: "RS09 — Retenção e eliminação segura",
    descricao: "Retenção mínima legal + destruição criptográfica ao término do ciclo (10 anos).",
    status: "pendente",
    evidencia: "Política publicada; automação de purge programada para o próximo sprint.",
    ultimaVerificacao: HOJE,
    proximaRevisao: "2026-08-15T00:00:00Z",
  },
];
