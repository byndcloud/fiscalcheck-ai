import type { Comunicacao, EventoProbatorio } from "@fiscalcheck/shared-types";

/*
  Comunicações eletrônicas — T15 (módulo 4).

  Cada comunicação está vinculada a um caso existente em `casos.ts`. Os
  eventos probatórios cobrem o ciclo enviada → entregue → ciência →
  respondida quando aplicável, com hash sintético (sha256 mock — nunca
  é o hash real do conteúdo em produção), IPs de exemplo e UAs
  pseudonimizados. Emails e telefones dos destinatários são fictícios.
*/

const ua = (device: "desktop" | "mobile" | "gateway") =>
  device === "desktop"
    ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FiscalCheckPortal/1.4"
    : device === "mobile"
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) FiscalCheckPortal/1.4"
      : "SEFAZ-GatewayNotifica/2.1 (twilio-mock)";

function hash(seed: string): string {
  let h = 0n;
  for (const ch of seed) h = (h * 31n + BigInt(ch.charCodeAt(0))) & 0xffffffffffffffffn;
  const hex = h.toString(16).padStart(16, "0");
  return `${hex}${hex}${hex}${hex}`.slice(0, 64);
}

function evento(
  id: string,
  timestamp: string,
  tipo: EventoProbatorio["tipo"],
  seed: string,
  extra: Partial<EventoProbatorio> = {},
): EventoProbatorio {
  return {
    id,
    timestamp,
    tipo,
    hashConteudo: hash(seed),
    ...extra,
  };
}

export const comunicacoesFixture: Comunicacao[] = [
  // 1 · Nova Aurora Confecções — termo de intimação por PORTAL (respondida)
  {
    id: "cm-2026-0142-a",
    protocolo: "CE-2026-000142",
    casoId: "cs-2026-0142",
    contribuinteId: "ct-001",
    canal: "portal",
    status: "respondida",
    assunto: "Intimação · CS-2026-0142 · Divergência de faturamento ISS 2Q/2025",
    conteudoResumo:
      "Solicitação de esclarecimento sobre divergências identificadas entre NFS-e emitidas e DIMP declaradas no 2º trimestre de 2025.",
    destinatario: {
      nome: "Nova Aurora Confecções Ltda.",
      email: "financeiro@novaaurora.com.br",
      portalUserId: "PU-NAC-001",
    },
    documentoId: "doc-2026-0142",
    enviadaEm: "2026-07-01T14:30:00Z",
    entregueEm: "2026-07-01T14:30:12Z",
    cienciaEm: "2026-07-01T18:22:41Z",
    respondidaEm: "2026-07-02T15:47:00Z",
    prazoRespostaEm: "2026-07-11T23:59:59Z",
    respostaConteudo:
      "Anexamos relatório de conciliação da NFS-e vs. DIMP com identificação de 4 notas emitidas em regime especial. Solicitamos revisão do enquadramento.",
    eventos: [
      evento("ev-0142-01", "2026-07-01T14:30:00Z", "envio", "cm-2026-0142-a-envio", {
        ipOrigem: "10.42.0.12",
        userAgent: "FiscalCheckAgent/1.0",
        detalhes: "Payload assinado e depositado no Portal SEFAZ.",
      }),
      evento("ev-0142-02", "2026-07-01T14:30:12Z", "entrega", "cm-2026-0142-a-entrega", {
        detalhes: "Portal confirmou recebimento da comunicação.",
      }),
      evento("ev-0142-03", "2026-07-01T18:22:41Z", "abertura", "cm-2026-0142-a-abertura", {
        ipOrigem: "179.110.42.88",
        userAgent: ua("desktop"),
        detalhes: "Contribuinte abriu a comunicação no Portal.",
      }),
      evento("ev-0142-04", "2026-07-01T18:22:55Z", "ciencia_registrada", "cm-2026-0142-a-ciencia", {
        ipOrigem: "179.110.42.88",
        userAgent: ua("desktop"),
        detalhes: "Ciência formal registrada com aceite eletrônico.",
      }),
      evento("ev-0142-05", "2026-07-02T15:47:00Z", "resposta_recebida", "cm-2026-0142-a-resposta", {
        ipOrigem: "179.110.42.88",
        userAgent: ua("desktop"),
        detalhes: "Resposta com anexos recebida pelo Portal.",
      }),
    ],
  },

  // 2 · Nova Aurora — segunda intimação por EMAIL (entregue)
  {
    id: "cm-2026-0142-b",
    protocolo: "CE-2026-000158",
    casoId: "cs-2026-0142",
    contribuinteId: "ct-001",
    canal: "email",
    status: "entregue",
    assunto: "Complemento de documentação · CS-2026-0142",
    conteudoResumo:
      "Solicitação complementar de livros fiscais dos meses de junho e julho de 2025 para conclusão da análise.",
    destinatario: {
      nome: "Nova Aurora Confecções Ltda.",
      email: "financeiro@novaaurora.com.br",
    },
    enviadaEm: "2026-07-02T16:15:00Z",
    entregueEm: "2026-07-02T16:15:04Z",
    prazoRespostaEm: "2026-07-09T23:59:59Z",
    eventos: [
      evento("ev-0158-01", "2026-07-02T16:15:00Z", "envio", "cm-2026-0142-b-envio", {
        detalhes: "Enviado via gateway SMTP autenticado.",
      }),
      evento("ev-0158-02", "2026-07-02T16:15:04Z", "entrega", "cm-2026-0142-b-entrega", {
        detalhes: "Servidor destino aceitou o envelope (250 OK).",
      }),
    ],
  },

  // 3 · Malharia Serra Bela — intimação por PORTAL (ciência)
  {
    id: "cm-2026-0138-a",
    protocolo: "CE-2026-000138",
    casoId: "cs-2026-0138",
    contribuinteId: "ct-006",
    canal: "portal",
    status: "ciencia",
    assunto: "Intimação · CS-2026-0138 · ISS declarado abaixo do apurado (2024-2025)",
    conteudoResumo:
      "Divergência sistemática entre PGDAS-D e NFS-e emitidas ao longo de 8 competências consecutivas.",
    destinatario: {
      nome: "Malharia Serra Bela Ltda.",
      email: "contato@serrabela.com.br",
      portalUserId: "PU-MSB-006",
    },
    documentoId: "doc-2026-0138",
    enviadaEm: "2026-07-02T10:00:00Z",
    entregueEm: "2026-07-02T10:00:08Z",
    cienciaEm: "2026-07-02T20:11:00Z",
    prazoRespostaEm: "2026-07-12T23:59:59Z",
    eventos: [
      evento("ev-0138-01", "2026-07-02T10:00:00Z", "envio", "cm-2026-0138-a-envio"),
      evento("ev-0138-02", "2026-07-02T10:00:08Z", "entrega", "cm-2026-0138-a-entrega"),
      evento("ev-0138-03", "2026-07-02T20:10:22Z", "abertura", "cm-2026-0138-a-abertura", {
        ipOrigem: "201.87.100.14",
        userAgent: ua("mobile"),
      }),
      evento("ev-0138-04", "2026-07-02T20:11:00Z", "ciencia_registrada", "cm-2026-0138-a-ciencia", {
        ipOrigem: "201.87.100.14",
        userAgent: ua("mobile"),
      }),
    ],
  },

  // 4 · Drogaria Vida Nova — WhatsApp lembrete (entregue)
  {
    id: "cm-2026-0135-a",
    protocolo: "CE-2026-000135",
    casoId: "cs-2026-0135",
    contribuinteId: "ct-009",
    canal: "whatsapp",
    status: "entregue",
    assunto: "Lembrete · Intimação eletrônica CS-2026-0135",
    conteudoResumo:
      "Lembrete cordial de que existe uma intimação eletrônica aguardando ciência no Portal do Contribuinte.",
    destinatario: {
      nome: "Drogaria Vida Nova Ltda.",
      telefoneMascarado: "+55 (47) *****-4821",
    },
    enviadaEm: "2026-07-02T13:00:00Z",
    entregueEm: "2026-07-02T13:00:03Z",
    prazoRespostaEm: "2026-07-08T23:59:59Z",
    eventos: [
      evento("ev-0135-01", "2026-07-02T13:00:00Z", "envio", "cm-2026-0135-a-envio", {
        userAgent: ua("gateway"),
        detalhes: "Mensagem template aprovado enviada via provedor Business API.",
      }),
      evento("ev-0135-02", "2026-07-02T13:00:03Z", "entrega", "cm-2026-0135-a-entrega", {
        userAgent: ua("gateway"),
        detalhes: "Callback do provedor confirmou entrega (delivered).",
      }),
    ],
  },

  // 5 · Clínica Sorriso — email (respondida)
  {
    id: "cm-2026-0132-a",
    protocolo: "CE-2026-000132",
    casoId: "cs-2026-0132",
    contribuinteId: "ct-015",
    canal: "email",
    status: "respondida",
    assunto: "Intimação · CS-2026-0132 · Retenção de ISS de tomadores fora do município",
    conteudoResumo:
      "Solicitação de esclarecimento sobre retenção de ISS em prestações a tomadores estabelecidos fora de Brusque/SC.",
    destinatario: {
      nome: "Clínica Sorriso Odontologia Ltda.",
      email: "administrativo@clinicasorriso.com.br",
    },
    enviadaEm: "2026-06-30T09:00:00Z",
    entregueEm: "2026-06-30T09:00:02Z",
    cienciaEm: "2026-06-30T14:11:00Z",
    respondidaEm: "2026-07-01T17:20:00Z",
    prazoRespostaEm: "2026-07-10T23:59:59Z",
    respostaConteudo:
      "Encaminhamos memorando com metodologia de retenção adotada e comprovantes das guias DAM recolhidas.",
    eventos: [
      evento("ev-0132-01", "2026-06-30T09:00:00Z", "envio", "cm-2026-0132-a-envio"),
      evento("ev-0132-02", "2026-06-30T09:00:02Z", "entrega", "cm-2026-0132-a-entrega"),
      evento("ev-0132-03", "2026-06-30T14:10:30Z", "abertura", "cm-2026-0132-a-abertura", {
        ipOrigem: "191.44.201.9",
        userAgent: ua("desktop"),
      }),
      evento("ev-0132-04", "2026-06-30T14:11:00Z", "ciencia_registrada", "cm-2026-0132-a-ciencia", {
        ipOrigem: "191.44.201.9",
        userAgent: ua("desktop"),
      }),
      evento("ev-0132-05", "2026-07-01T17:20:00Z", "resposta_recebida", "cm-2026-0132-a-resposta"),
    ],
  },

  // 6 · Vale Têxtil — Termo de Intimação por PORTAL (respondida)
  {
    id: "cm-2026-0128-a",
    protocolo: "CE-2026-000128",
    casoId: "cs-2026-0128",
    contribuinteId: "ct-002",
    canal: "portal",
    status: "respondida",
    assunto: "Intimação eletrônica · CS-2026-0128 · Exportação de serviços 2025",
    conteudoResumo:
      "Solicitação de contratos, faturas e comprovantes de câmbio das operações classificadas como exportação de serviço.",
    destinatario: {
      nome: "Vale Têxtil Indústria e Comércio S.A.",
      email: "controladoria@valetextil.com.br",
      portalUserId: "PU-VT-002",
    },
    documentoId: "doc-2026-0128",
    enviadaEm: "2026-06-25T14:00:00Z",
    entregueEm: "2026-06-25T14:00:05Z",
    cienciaEm: "2026-06-25T17:44:12Z",
    respondidaEm: "2026-07-01T18:47:00Z",
    prazoRespostaEm: "2026-07-05T23:59:59Z",
    respostaConteudo:
      "Anexamos contratos, invoices, câmbios pronto e comprovantes SISCOSERV das operações de 2025 (7 arquivos).",
    eventos: [
      evento("ev-0128-01", "2026-06-25T14:00:00Z", "envio", "cm-2026-0128-a-envio"),
      evento("ev-0128-02", "2026-06-25T14:00:05Z", "entrega", "cm-2026-0128-a-entrega"),
      evento("ev-0128-03", "2026-06-25T17:44:00Z", "abertura", "cm-2026-0128-a-abertura", {
        ipOrigem: "177.32.66.201",
        userAgent: ua("desktop"),
      }),
      evento("ev-0128-04", "2026-06-25T17:44:12Z", "ciencia_registrada", "cm-2026-0128-a-ciencia", {
        ipOrigem: "177.32.66.201",
        userAgent: ua("desktop"),
      }),
      evento("ev-0128-05", "2026-07-01T18:47:00Z", "resposta_recebida", "cm-2026-0128-a-resposta"),
    ],
  },

  // 7 · Rio Branco Cargas — Termo por PORTAL (ciência)
  {
    id: "cm-2026-0126-a",
    protocolo: "CE-2026-000126",
    casoId: "cs-2026-0126",
    contribuinteId: "ct-008",
    canal: "portal",
    status: "ciencia",
    assunto: "Termo de Intimação · CS-2026-0126 · ISS retido de transportadores",
    conteudoResumo:
      "Retenção de ISS de contratantes rodoviários exige comprovação por CIOT/CT-e e recolhimento por competência.",
    destinatario: {
      nome: "Rio Branco Cargas & Logística Ltda.",
      email: "fiscal@riobrancocargas.com.br",
      portalUserId: "PU-RBC-008",
    },
    documentoId: "doc-2026-0126",
    enviadaEm: "2026-06-28T15:35:00Z",
    entregueEm: "2026-06-28T15:35:04Z",
    cienciaEm: "2026-06-29T09:22:00Z",
    prazoRespostaEm: "2026-07-08T23:59:59Z",
    eventos: [
      evento("ev-0126-01", "2026-06-28T15:35:00Z", "envio", "cm-2026-0126-a-envio"),
      evento("ev-0126-02", "2026-06-28T15:35:04Z", "entrega", "cm-2026-0126-a-entrega"),
      evento("ev-0126-03", "2026-06-29T09:21:44Z", "abertura", "cm-2026-0126-a-abertura", {
        ipOrigem: "45.187.30.72",
        userAgent: ua("desktop"),
      }),
      evento("ev-0126-04", "2026-06-29T09:22:00Z", "ciencia_registrada", "cm-2026-0126-a-ciencia", {
        ipOrigem: "45.187.30.72",
        userAgent: ua("desktop"),
      }),
    ],
  },

  // 8 · Rio Branco Cargas — SMS lembrete (entregue)
  {
    id: "cm-2026-0126-b",
    protocolo: "CE-2026-000159",
    casoId: "cs-2026-0126",
    contribuinteId: "ct-008",
    canal: "sms",
    status: "entregue",
    assunto: "Lembrete SMS · Prazo em 24h",
    conteudoResumo:
      "SEFAZ Brusque: sua intimação CE-2026-000126 tem prazo em 24h. Acesse o Portal.",
    destinatario: {
      nome: "Rio Branco Cargas & Logística Ltda.",
      telefoneMascarado: "+55 (47) *****-7712",
    },
    enviadaEm: "2026-07-01T09:00:00Z",
    entregueEm: "2026-07-01T09:00:02Z",
    prazoRespostaEm: "2026-07-02T23:59:59Z",
    eventos: [
      evento("ev-0159-01", "2026-07-01T09:00:00Z", "envio", "cm-2026-0126-b-envio", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0159-02", "2026-07-01T09:00:02Z", "entrega", "cm-2026-0126-b-entrega", {
        userAgent: ua("gateway"),
        detalhes: "Callback do provedor confirmou entrega ao MSISDN.",
      }),
    ],
  },

  // 9 · Amazônia Log — email (falha temporária)
  {
    id: "cm-2026-0123-a",
    protocolo: "CE-2026-000123",
    casoId: "cs-2026-0123",
    contribuinteId: "ct-018",
    canal: "email",
    status: "falha",
    assunto: "Intimação · CS-2026-0123 · Sublocação de espaço em galpão",
    conteudoResumo:
      "Análise de contratos de sublocação e reclassificação como serviço tributável pelo ISS.",
    destinatario: {
      nome: "Amazônia Log & Armazéns Ltda.",
      email: "fiscal@amazonialog.com.br",
    },
    enviadaEm: "2026-06-27T09:00:00Z",
    prazoRespostaEm: "2026-07-07T23:59:59Z",
    eventos: [
      evento("ev-0123-01", "2026-06-27T09:00:00Z", "envio", "cm-2026-0123-a-envio"),
      evento("ev-0123-02", "2026-06-27T09:00:12Z", "falha_temporaria", "cm-2026-0123-a-falha", {
        detalhes: "Servidor destino recusou envelope: 451 Temporary local problem.",
      }),
    ],
  },

  // 10 · Amazônia Log — PORTAL (reenvio, entregue)
  {
    id: "cm-2026-0123-b",
    protocolo: "CE-2026-000160",
    casoId: "cs-2026-0123",
    contribuinteId: "ct-018",
    canal: "portal",
    status: "entregue",
    assunto: "Intimação (reenviada) · CS-2026-0123 · Sublocação de espaço em galpão",
    conteudoResumo:
      "Reenvio no Portal após falha temporária de e-mail. Conteúdo idêntico à comunicação CE-2026-000123.",
    destinatario: {
      nome: "Amazônia Log & Armazéns Ltda.",
      portalUserId: "PU-AL-018",
    },
    enviadaEm: "2026-06-27T10:15:00Z",
    entregueEm: "2026-06-27T10:15:03Z",
    prazoRespostaEm: "2026-07-07T23:59:59Z",
    eventos: [
      evento("ev-0160-01", "2026-06-27T10:15:00Z", "reenvio", "cm-2026-0123-b-reenvio", {
        detalhes: "Reenvio programático após falha do canal e-mail.",
      }),
      evento("ev-0160-02", "2026-06-27T10:15:03Z", "entrega", "cm-2026-0123-b-entrega"),
    ],
  },

  // 11 · Ícaro TI — PORTAL (respondida — aceite de autorregularização)
  {
    id: "cm-2026-0117-a",
    protocolo: "CE-2026-000117",
    casoId: "cs-2026-0117",
    contribuinteId: "ct-004",
    canal: "portal",
    status: "respondida",
    assunto: "Convite à autorregularização · CS-2026-0117",
    conteudoResumo:
      "Convite formal para adesão ao programa de autorregularização com desconto de multa e juros.",
    destinatario: {
      nome: "Ícaro TI Serviços Digitais Ltda.",
      portalUserId: "PU-ITI-004",
    },
    enviadaEm: "2026-06-24T11:00:00Z",
    entregueEm: "2026-06-24T11:00:04Z",
    cienciaEm: "2026-06-24T14:30:00Z",
    respondidaEm: "2026-06-28T11:00:00Z",
    prazoRespostaEm: "2026-07-04T23:59:59Z",
    respostaConteudo:
      "Aceitamos os termos da autorregularização e anexamos calendário de pagamento em 6 parcelas.",
    eventos: [
      evento("ev-0117-01", "2026-06-24T11:00:00Z", "envio", "cm-2026-0117-a-envio"),
      evento("ev-0117-02", "2026-06-24T11:00:04Z", "entrega", "cm-2026-0117-a-entrega"),
      evento("ev-0117-03", "2026-06-24T14:29:44Z", "abertura", "cm-2026-0117-a-abertura", {
        ipOrigem: "200.187.212.55",
        userAgent: ua("desktop"),
      }),
      evento("ev-0117-04", "2026-06-24T14:30:00Z", "ciencia_registrada", "cm-2026-0117-a-ciencia", {
        ipOrigem: "200.187.212.55",
        userAgent: ua("desktop"),
      }),
      evento("ev-0117-05", "2026-06-28T11:00:00Z", "resposta_recebida", "cm-2026-0117-a-resposta"),
    ],
  },

  // 12 · Ícaro TI — WhatsApp (respondida com confirmação de calendário)
  {
    id: "cm-2026-0117-b",
    protocolo: "CE-2026-000161",
    casoId: "cs-2026-0117",
    contribuinteId: "ct-004",
    canal: "whatsapp",
    status: "respondida",
    assunto: "Confirmação de calendário de autorregularização",
    conteudoResumo:
      "Confirmação da primeira parcela paga e adesão ao cronograma acordado no Portal.",
    destinatario: {
      nome: "Ícaro TI Serviços Digitais Ltda.",
      telefoneMascarado: "+55 (47) *****-3390",
    },
    enviadaEm: "2026-06-28T15:00:00Z",
    entregueEm: "2026-06-28T15:00:02Z",
    cienciaEm: "2026-06-28T15:04:11Z",
    respondidaEm: "2026-06-28T15:07:44Z",
    respostaConteudo: "Confirmado! Primeira parcela paga hoje. Obrigado.",
    eventos: [
      evento("ev-0161-01", "2026-06-28T15:00:00Z", "envio", "cm-2026-0117-b-envio", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0161-02", "2026-06-28T15:00:02Z", "entrega", "cm-2026-0117-b-entrega", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0161-03", "2026-06-28T15:04:11Z", "ciencia_registrada", "cm-2026-0117-b-ciencia", {
        userAgent: ua("gateway"),
        detalhes: "Contribuinte visualizou a mensagem (double-check).",
      }),
      evento("ev-0161-04", "2026-06-28T15:07:44Z", "resposta_recebida", "cm-2026-0117-b-resposta", {
        userAgent: ua("gateway"),
      }),
    ],
  },

  // 13 · Colinas do Vale — Termo Fiscalização por PORTAL (ciência)
  {
    id: "cm-2026-0099-a",
    protocolo: "CE-2026-000099",
    casoId: "cs-2026-0099",
    contribuinteId: "ct-010",
    canal: "portal",
    status: "ciencia",
    assunto: "Termo de Início de Fiscalização · CS-2026-0099",
    conteudoResumo:
      "Instauração de procedimento fiscal presencial em razão de omissão sistemática de receita apurada.",
    destinatario: {
      nome: "Colinas do Vale Empreendimentos Ltda.",
      email: "diretoria@colinasdovale.com.br",
      portalUserId: "PU-CV-010",
    },
    documentoId: "doc-2026-0099",
    enviadaEm: "2026-06-05T11:00:00Z",
    entregueEm: "2026-06-05T11:00:06Z",
    cienciaEm: "2026-06-06T09:47:12Z",
    prazoRespostaEm: "2026-06-15T23:59:59Z",
    eventos: [
      evento("ev-0099-01", "2026-06-05T11:00:00Z", "envio", "cm-2026-0099-a-envio"),
      evento("ev-0099-02", "2026-06-05T11:00:06Z", "entrega", "cm-2026-0099-a-entrega"),
      evento("ev-0099-03", "2026-06-06T09:46:50Z", "abertura", "cm-2026-0099-a-abertura", {
        ipOrigem: "45.234.44.7",
        userAgent: ua("desktop"),
      }),
      evento("ev-0099-04", "2026-06-06T09:47:12Z", "ciencia_registrada", "cm-2026-0099-a-ciencia", {
        ipOrigem: "45.234.44.7",
        userAgent: ua("desktop"),
      }),
    ],
  },

  // 14 · Coração Catarinense — Termo Fiscalização por PORTAL (ciência)
  {
    id: "cm-2026-0104-a",
    protocolo: "CE-2026-000104",
    casoId: "cs-2026-0104",
    contribuinteId: "ct-007",
    canal: "portal",
    status: "ciencia",
    assunto: "Termo de Início de Fiscalização · CS-2026-0104",
    conteudoResumo:
      "Fiscalização instaurada após ausência de resposta a duas comunicações amigáveis.",
    destinatario: {
      nome: "Coração Catarinense Alimentos Ltda.",
      email: "fiscal@coracaocatarinense.com.br",
      portalUserId: "PU-CC-007",
    },
    documentoId: "doc-2026-0104",
    enviadaEm: "2026-06-15T09:00:00Z",
    entregueEm: "2026-06-15T09:00:05Z",
    cienciaEm: "2026-06-15T11:22:14Z",
    prazoRespostaEm: "2026-06-25T23:59:59Z",
    eventos: [
      evento("ev-0104-01", "2026-06-15T09:00:00Z", "envio", "cm-2026-0104-a-envio"),
      evento("ev-0104-02", "2026-06-15T09:00:05Z", "entrega", "cm-2026-0104-a-entrega"),
      evento("ev-0104-03", "2026-06-15T11:22:00Z", "abertura", "cm-2026-0104-a-abertura", {
        ipOrigem: "168.90.11.34",
        userAgent: ua("desktop"),
      }),
      evento("ev-0104-04", "2026-06-15T11:22:14Z", "ciencia_registrada", "cm-2026-0104-a-ciencia", {
        ipOrigem: "168.90.11.34",
        userAgent: ua("desktop"),
      }),
    ],
  },

  // 15 · Bella Nova Beleza — email (enviada, aguardando entrega)
  {
    id: "cm-2026-0115-a",
    protocolo: "CE-2026-000115",
    casoId: "cs-2026-0115",
    contribuinteId: "ct-012",
    canal: "email",
    status: "enviada",
    assunto: "Notificação · CS-2026-0115 · Regularização ISS retido",
    conteudoResumo:
      "Solicitação de regularização das guias de ISS retido não recolhidas nos últimos 3 meses.",
    destinatario: {
      nome: "Bella Nova Beleza & Estética Ltda.",
      email: "financeiro@bellanova.com.br",
    },
    enviadaEm: "2026-07-03T08:15:00Z",
    prazoRespostaEm: "2026-07-13T23:59:59Z",
    eventos: [
      evento("ev-0115-01", "2026-07-03T08:15:00Z", "envio", "cm-2026-0115-a-envio", {
        detalhes: "Envelope aceito pelo gateway SMTP; aguardando confirmação do destino.",
      }),
    ],
  },

  // 16 · Bella Nova — SMS (entregue)
  {
    id: "cm-2026-0115-b",
    protocolo: "CE-2026-000162",
    casoId: "cs-2026-0115",
    contribuinteId: "ct-012",
    canal: "sms",
    status: "entregue",
    assunto: "SMS · Notificação eletrônica disponível no Portal",
    conteudoResumo:
      "SEFAZ Brusque: notificação CE-2026-000115 disponível. Acesse portal.brusque.sc.gov.br",
    destinatario: {
      nome: "Bella Nova Beleza & Estética Ltda.",
      telefoneMascarado: "+55 (47) *****-6641",
    },
    enviadaEm: "2026-07-03T08:15:12Z",
    entregueEm: "2026-07-03T08:15:14Z",
    eventos: [
      evento("ev-0162-01", "2026-07-03T08:15:12Z", "envio", "cm-2026-0115-b-envio", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0162-02", "2026-07-03T08:15:14Z", "entrega", "cm-2026-0115-b-entrega", {
        userAgent: ua("gateway"),
      }),
    ],
  },

  // 17 · Panificadora Aurora — WhatsApp (falha)
  {
    id: "cm-2026-0112-a",
    protocolo: "CE-2026-000112",
    casoId: "cs-2026-0112",
    contribuinteId: "ct-017",
    canal: "whatsapp",
    status: "falha",
    assunto: "Aviso WhatsApp · CS-2026-0112",
    conteudoResumo:
      "Aviso de que existe uma pendência fiscal no Portal do Contribuinte a ser regularizada.",
    destinatario: {
      nome: "Panificadora Aurora Ltda. ME",
      telefoneMascarado: "+55 (47) *****-1109",
    },
    enviadaEm: "2026-06-22T10:00:00Z",
    eventos: [
      evento("ev-0112-01", "2026-06-22T10:00:00Z", "envio", "cm-2026-0112-a-envio", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0112-02", "2026-06-22T10:00:08Z", "falha_temporaria", "cm-2026-0112-a-falha", {
        userAgent: ua("gateway"),
        detalhes: "Provedor retornou erro 63016 (recipient not on WhatsApp).",
      }),
    ],
  },

  // 18 · Panificadora Aurora — PORTAL (respondida)
  {
    id: "cm-2026-0112-b",
    protocolo: "CE-2026-000163",
    casoId: "cs-2026-0112",
    contribuinteId: "ct-017",
    canal: "portal",
    status: "respondida",
    assunto: "Intimação · CS-2026-0112 · Simples Nacional · desenquadramento por sublimite",
    conteudoResumo:
      "Convite à autorregularização diante da apuração de excesso de sublimite estadual.",
    destinatario: {
      nome: "Panificadora Aurora Ltda. ME",
      email: "contato@panaurora.com.br",
      portalUserId: "PU-PA-017",
    },
    enviadaEm: "2026-06-22T10:30:00Z",
    entregueEm: "2026-06-22T10:30:04Z",
    cienciaEm: "2026-06-22T18:45:11Z",
    respondidaEm: "2026-06-24T14:00:00Z",
    prazoRespostaEm: "2026-07-02T23:59:59Z",
    respostaConteudo:
      "Reconhecemos o excesso e solicitamos parcelamento em 8x conforme LC 123/2006.",
    eventos: [
      evento("ev-0163-01", "2026-06-22T10:30:00Z", "envio", "cm-2026-0112-b-envio"),
      evento("ev-0163-02", "2026-06-22T10:30:04Z", "entrega", "cm-2026-0112-b-entrega"),
      evento("ev-0163-03", "2026-06-22T18:45:00Z", "abertura", "cm-2026-0112-b-abertura", {
        ipOrigem: "189.16.212.44",
        userAgent: ua("mobile"),
      }),
      evento("ev-0163-04", "2026-06-22T18:45:11Z", "ciencia_registrada", "cm-2026-0112-b-ciencia", {
        ipOrigem: "189.16.212.44",
        userAgent: ua("mobile"),
      }),
      evento("ev-0163-05", "2026-06-24T14:00:00Z", "resposta_recebida", "cm-2026-0112-b-resposta"),
    ],
  },

  // 19 · Sul Fashion — Portal (enviada, aguardando entrega)
  {
    id: "cm-2026-0143-a",
    protocolo: "CE-2026-000164",
    casoId: "cs-2026-0143",
    contribuinteId: "ct-003",
    canal: "portal",
    status: "enviada",
    assunto: "Notificação amigável · CS-2026-0143 · Divergência de faturamento 1º sem/2025",
    conteudoResumo:
      "Notificação preliminar para esclarecimento de divergência entre NFS-e emitidas e receita declarada no PGDAS-D do 1º semestre de 2025.",
    destinatario: {
      nome: "Confecções Sul Fashion Eireli",
      email: "financeiro@sulfashion.com.br",
      portalUserId: "PU-SF-003",
    },
    enviadaEm: "2026-07-03T09:20:00Z",
    prazoRespostaEm: "2026-07-14T23:59:59Z",
    eventos: [
      evento("ev-0164-01", "2026-07-03T09:20:00Z", "envio", "cm-2026-0143-a-envio", {
        detalhes: "Payload assinado e depositado no Portal SEFAZ.",
      }),
    ],
  },

  // 20 · Rio Grande Bebidas — Email (entregue)
  {
    id: "cm-2026-0148-a",
    protocolo: "CE-2026-000165",
    casoId: "cs-2026-0148",
    contribuinteId: "ct-013",
    canal: "email",
    status: "entregue",
    assunto: "Solicitação de esclarecimento · CS-2026-0148 · Retenção ISS sobre transporte",
    conteudoResumo:
      "Solicitação de comprovação da retenção de ISS sobre serviços de transporte contratados de tomadores de outros municípios.",
    destinatario: {
      nome: "Distribuidora Rio Grande de Bebidas S.A.",
      email: "fiscal@riograndebebidas.com.br",
    },
    enviadaEm: "2026-07-02T11:00:00Z",
    entregueEm: "2026-07-02T11:00:03Z",
    prazoRespostaEm: "2026-07-12T23:59:59Z",
    eventos: [
      evento("ev-0165-01", "2026-07-02T11:00:00Z", "envio", "cm-2026-0148-a-envio"),
      evento("ev-0165-02", "2026-07-02T11:00:03Z", "entrega", "cm-2026-0148-a-entrega", {
        detalhes: "Servidor destino aceitou o envelope (250 OK).",
      }),
    ],
  },

  // 21 · Estilo Sul — WhatsApp (entregue)
  {
    id: "cm-2026-0146-a",
    protocolo: "CE-2026-000166",
    casoId: "cs-2026-0146",
    contribuinteId: "ct-019",
    canal: "whatsapp",
    status: "entregue",
    assunto: "Aviso preliminar · CS-2026-0146",
    conteudoResumo:
      "Aviso de que existe pendência a ser esclarecida no Portal do Contribuinte referente ao caso CS-2026-0146.",
    destinatario: {
      nome: "Estilo Sul Comércio Varejista de Vestuário S.A.",
      telefoneMascarado: "+55 (47) *****-2244",
    },
    enviadaEm: "2026-07-02T14:30:00Z",
    entregueEm: "2026-07-02T14:30:02Z",
    prazoRespostaEm: "2026-07-09T23:59:59Z",
    eventos: [
      evento("ev-0166-01", "2026-07-02T14:30:00Z", "envio", "cm-2026-0146-a-envio", {
        userAgent: ua("gateway"),
        detalhes: "Mensagem template aprovado enviada via provedor Business API.",
      }),
      evento("ev-0166-02", "2026-07-02T14:30:02Z", "entrega", "cm-2026-0146-a-entrega", {
        userAgent: ua("gateway"),
        detalhes: "Callback do provedor confirmou entrega (delivered).",
      }),
    ],
  },

  // 22 · Madeira Fina — SMS (entregue)
  {
    id: "cm-2026-0141-a",
    protocolo: "CE-2026-000167",
    casoId: "cs-2026-0141",
    contribuinteId: "ct-016",
    canal: "sms",
    status: "entregue",
    assunto: "SMS · Nova pendência disponível no Portal",
    conteudoResumo:
      "SEFAZ Brusque: caso CS-2026-0141 aguarda seu esclarecimento. Acesse portal.brusque.sc.gov.br",
    destinatario: {
      nome: "Marcenaria Madeira Fina Ltda.",
      telefoneMascarado: "+55 (47) *****-8899",
    },
    enviadaEm: "2026-07-01T08:00:00Z",
    entregueEm: "2026-07-01T08:00:04Z",
    eventos: [
      evento("ev-0167-01", "2026-07-01T08:00:00Z", "envio", "cm-2026-0141-a-envio", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0167-02", "2026-07-01T08:00:04Z", "entrega", "cm-2026-0141-a-entrega", {
        userAgent: ua("gateway"),
        detalhes: "Callback do provedor confirmou entrega ao MSISDN.",
      }),
    ],
  },

  // 23 · Autoescola Rota Segura — Portal (ciência)
  {
    id: "cm-2026-0139-a",
    protocolo: "CE-2026-000168",
    casoId: "cs-2026-0139",
    contribuinteId: "ct-005",
    canal: "portal",
    status: "ciencia",
    assunto: "Intimação · CS-2026-0139 · Divergência entre PGDAS-D e NFS-e",
    conteudoResumo:
      "Solicitação de conciliação entre receita declarada no PGDAS-D e receita bruta apurada por NFS-e emitidas no 1º trimestre de 2026.",
    destinatario: {
      nome: "Autoescola Rota Segura Ltda.",
      email: "administrativo@rotasegura.com.br",
      portalUserId: "PU-RS-005",
    },
    enviadaEm: "2026-06-26T09:00:00Z",
    entregueEm: "2026-06-26T09:00:07Z",
    cienciaEm: "2026-06-26T18:33:11Z",
    prazoRespostaEm: "2026-07-06T23:59:59Z",
    eventos: [
      evento("ev-0168-01", "2026-06-26T09:00:00Z", "envio", "cm-2026-0139-a-envio"),
      evento("ev-0168-02", "2026-06-26T09:00:07Z", "entrega", "cm-2026-0139-a-entrega"),
      evento("ev-0168-03", "2026-06-26T18:32:44Z", "abertura", "cm-2026-0139-a-abertura", {
        ipOrigem: "187.60.44.19",
        userAgent: ua("mobile"),
      }),
      evento("ev-0168-04", "2026-06-26T18:33:11Z", "ciencia_registrada", "cm-2026-0139-a-ciencia", {
        ipOrigem: "187.60.44.19",
        userAgent: ua("mobile"),
      }),
    ],
  },

  // 24 · Alfa Design — Email (respondida)
  {
    id: "cm-2026-0136-a",
    protocolo: "CE-2026-000169",
    casoId: "cs-2026-0136",
    contribuinteId: "ct-011",
    canal: "email",
    status: "respondida",
    assunto: "Intimação · CS-2026-0136 · Enquadramento de serviços de comunicação visual",
    conteudoResumo:
      "Solicitação de detalhamento dos serviços prestados que sustentam o enquadramento no item 17.02 da LC 116/2003.",
    destinatario: {
      nome: "Estúdio de Design Alfa Comunicação ME",
      email: "diretoria@alfadesign.com.br",
    },
    enviadaEm: "2026-06-23T14:00:00Z",
    entregueEm: "2026-06-23T14:00:02Z",
    cienciaEm: "2026-06-23T18:47:00Z",
    respondidaEm: "2026-06-30T11:15:00Z",
    prazoRespostaEm: "2026-07-03T23:59:59Z",
    respostaConteudo:
      "Encaminhamos memorial descritivo dos serviços prestados, notas explicativas e amostras dos contratos padrão de 2025.",
    eventos: [
      evento("ev-0169-01", "2026-06-23T14:00:00Z", "envio", "cm-2026-0136-a-envio"),
      evento("ev-0169-02", "2026-06-23T14:00:02Z", "entrega", "cm-2026-0136-a-entrega"),
      evento("ev-0169-03", "2026-06-23T18:46:30Z", "abertura", "cm-2026-0136-a-abertura", {
        ipOrigem: "177.20.192.44",
        userAgent: ua("desktop"),
      }),
      evento("ev-0169-04", "2026-06-23T18:47:00Z", "ciencia_registrada", "cm-2026-0136-a-ciencia", {
        ipOrigem: "177.20.192.44",
        userAgent: ua("desktop"),
      }),
      evento("ev-0169-05", "2026-06-30T11:15:00Z", "resposta_recebida", "cm-2026-0136-a-resposta"),
    ],
  },

  // 25 · Números & Cia. — Portal (respondida — escritório contábil)
  {
    id: "cm-2026-0134-a",
    protocolo: "CE-2026-000170",
    casoId: "cs-2026-0134",
    contribuinteId: "ct-014",
    canal: "portal",
    status: "respondida",
    assunto: "Intimação · CS-2026-0134 · Retenção de ISS de clientes tomadores",
    conteudoResumo:
      "Solicitação de comprovação da retenção de ISS em nome dos clientes tomadores e recolhimento nas competências devidas.",
    destinatario: {
      nome: "Escritório Contábil Números e Cia. Ltda.",
      email: "socios@numeroscia.com.br",
      portalUserId: "PU-NC-014",
    },
    enviadaEm: "2026-06-21T10:00:00Z",
    entregueEm: "2026-06-21T10:00:05Z",
    cienciaEm: "2026-06-21T11:30:00Z",
    respondidaEm: "2026-06-24T16:00:00Z",
    prazoRespostaEm: "2026-07-01T23:59:59Z",
    respostaConteudo:
      "Anexamos as GIA municipais, DAM recolhidas e planilha de conciliação por competência (jan-mai/2026).",
    eventos: [
      evento("ev-0170-01", "2026-06-21T10:00:00Z", "envio", "cm-2026-0134-a-envio"),
      evento("ev-0170-02", "2026-06-21T10:00:05Z", "entrega", "cm-2026-0134-a-entrega"),
      evento("ev-0170-03", "2026-06-21T11:29:44Z", "abertura", "cm-2026-0134-a-abertura", {
        ipOrigem: "200.220.10.7",
        userAgent: ua("desktop"),
      }),
      evento("ev-0170-04", "2026-06-21T11:30:00Z", "ciencia_registrada", "cm-2026-0134-a-ciencia", {
        ipOrigem: "200.220.10.7",
        userAgent: ua("desktop"),
      }),
      evento("ev-0170-05", "2026-06-24T16:00:00Z", "resposta_recebida", "cm-2026-0134-a-resposta"),
    ],
  },

  // 26 · Espelho Mágico — WhatsApp (respondida — MEI resolve rápido)
  {
    id: "cm-2026-0131-a",
    protocolo: "CE-2026-000171",
    casoId: "cs-2026-0131",
    contribuinteId: "ct-020",
    canal: "whatsapp",
    status: "respondida",
    assunto: "Aviso · CS-2026-0131 · Pendência de ISS Fixo do MEI",
    conteudoResumo:
      "Aviso amigável de pendência de ISS Fixo do MEI para os meses de abril e maio de 2026.",
    destinatario: {
      nome: "Salão de Beleza Espelho Mágico ME",
      telefoneMascarado: "+55 (47) *****-5510",
    },
    enviadaEm: "2026-06-19T09:00:00Z",
    entregueEm: "2026-06-19T09:00:02Z",
    cienciaEm: "2026-06-19T09:04:33Z",
    respondidaEm: "2026-06-19T09:32:11Z",
    respostaConteudo:
      "Já paguei as guias DAM abril e maio agora pelo internet banking. Segue comprovante em anexo.",
    eventos: [
      evento("ev-0171-01", "2026-06-19T09:00:00Z", "envio", "cm-2026-0131-a-envio", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0171-02", "2026-06-19T09:00:02Z", "entrega", "cm-2026-0131-a-entrega", {
        userAgent: ua("gateway"),
      }),
      evento("ev-0171-03", "2026-06-19T09:04:33Z", "ciencia_registrada", "cm-2026-0131-a-ciencia", {
        userAgent: ua("gateway"),
        detalhes: "Contribuinte visualizou a mensagem (double-check).",
      }),
      evento("ev-0171-04", "2026-06-19T09:32:11Z", "resposta_recebida", "cm-2026-0131-a-resposta", {
        userAgent: ua("gateway"),
      }),
    ],
  },

  // 27 · Passarinho Amarelo — Email (falha permanente do destino)
  {
    id: "cm-2026-0130-a",
    protocolo: "CE-2026-000172",
    casoId: "cs-2026-0130",
    contribuinteId: "ct-034",
    canal: "email",
    status: "falha",
    assunto: "Intimação · CS-2026-0130 · Regularização de ISS de creche/educação infantil",
    conteudoResumo:
      "Solicitação de comprovação da imunidade tributária alegada nos serviços de educação infantil.",
    destinatario: {
      nome: "Escola Infantil Passarinho Amarelo Ltda.",
      email: "financeiro@passarinhoamarelo.com.br",
    },
    enviadaEm: "2026-06-18T08:30:00Z",
    prazoRespostaEm: "2026-06-28T23:59:59Z",
    eventos: [
      evento("ev-0172-01", "2026-06-18T08:30:00Z", "envio", "cm-2026-0130-a-envio"),
      evento("ev-0172-02", "2026-06-18T08:30:14Z", "falha_temporaria", "cm-2026-0130-a-falha", {
        detalhes:
          "Servidor destino retornou 550 5.1.1 (mailbox unavailable). Endereço requer atualização cadastral.",
      }),
    ],
  },

  // 28 · Sabores da Colônia — Portal (entregue, aguardando ciência)
  {
    id: "cm-2026-0127-a",
    protocolo: "CE-2026-000173",
    casoId: "cs-2026-0127",
    contribuinteId: "ct-036",
    canal: "portal",
    status: "entregue",
    assunto: "Intimação · CS-2026-0127 · Enquadramento de produtos artesanais",
    conteudoResumo:
      "Solicitação de detalhamento das operações mistas de venda de produtos + preparo local para separação de bases ICMS/ISS.",
    destinatario: {
      nome: "Empório Sabores da Colônia Ltda.",
      email: "contato@saboresdacolonia.com.br",
      portalUserId: "PU-SC-036",
    },
    enviadaEm: "2026-06-16T15:00:00Z",
    entregueEm: "2026-06-16T15:00:06Z",
    prazoRespostaEm: "2026-06-26T23:59:59Z",
    eventos: [
      evento("ev-0173-01", "2026-06-16T15:00:00Z", "envio", "cm-2026-0127-a-envio"),
      evento("ev-0173-02", "2026-06-16T15:00:06Z", "entrega", "cm-2026-0127-a-entrega", {
        detalhes: "Portal confirmou recebimento da comunicação.",
      }),
    ],
  },
];
