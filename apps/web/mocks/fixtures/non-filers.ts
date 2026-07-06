import type { NonFiler } from "@fiscalcheck/shared-types";

/*
  Prestadores "fora do radar" (T06 · módulo 2 · RF02).
  Descobertos por evidências indiretas — nenhum tem cadastro mobiliário.
  Perfis representativos da economia local de Brusque/SC (facção têxtil,
  serviços, alimentação), todos 100% sintéticos com documentos
  mascarados (AGENTS.md §1.2).
*/
export const nonFilersFixture: NonFiler[] = [
  {
    id: "nf-radar-001",
    nomeIndicado: "Facção Costura Ribeirão (nome de fachada)",
    documentoMascarado: "***.***.***-51 (CPF)",
    atividadePresumida: "14.12-6 · Confecção de peças do vestuário (facção)",
    municipio: "Brusque",
    receitaEstimada12m: 486_000,
    detectadoEm: "2026-06-27T09:40:00Z",
    status: "novo",
    indicios: [
      {
        fonte: "nfse_terceiros",
        resumo:
          "38 NFS-e de indústrias têxteis locais registram a mesma facção como tomadora de insumos e transporte, sem nenhuma NFS-e emitida em contrapartida.",
        valorEstimado: 312_000,
        referencia: "38 NFS-e de 4 prestadores distintos (01/2025–05/2026)",
      },
      {
        fonte: "meios_pagamento",
        resumo:
          "DIMP aponta recebimentos recorrentes em maquininha vinculada ao CPF, média de R$ 14.500/mês.",
        valorEstimado: 174_000,
        referencia: "DIMP — 12 competências consecutivas",
      },
    ],
  },
  {
    id: "nf-radar-002",
    nomeIndicado: "Buffet & Eventos Recanto Verde",
    documentoMascarado: "**.***.***/0001-** (CNPJ de outro município)",
    atividadePresumida: "56.20-1 · Serviços de alimentação para eventos",
    municipio: "Brusque",
    receitaEstimada12m: 298_000,
    detectadoEm: "2026-06-30T14:10:00Z",
    status: "novo",
    indicios: [
      {
        fonte: "fonte_aberta",
        resumo:
          "Perfil comercial ativo divulga eventos semanais realizados em Brusque; endereço fixo de salão identificado no bairro Steffen.",
        valorEstimado: 120_000,
        referencia: "Redes sociais + registro de eventos públicos (2025–2026)",
      },
      {
        fonte: "nfse_terceiros",
        resumo:
          "Locações de salão e NFS-e de decoração tomadas em Brusque indicam ao menos 26 eventos no período, sem ISS recolhido no município.",
        valorEstimado: 178_000,
        referencia: "26 NFS-e de locação/decoração com o buffet como tomador",
      },
    ],
  },
  {
    id: "nf-radar-003",
    nomeIndicado: "Estúdio Pilates Corpo Leve",
    documentoMascarado: "***.***.***-83 (CPF)",
    atividadePresumida: "93.13-1 · Atividades de condicionamento físico",
    municipio: "Brusque",
    receitaEstimada12m: 187_000,
    detectadoEm: "2026-07-01T08:25:00Z",
    status: "novo",
    indicios: [
      {
        fonte: "meios_pagamento",
        resumo:
          "DIMP registra recebimentos por cartão e Pix comercial de R$ 15.600/mês em terminal fixo no Centro, sem inscrição municipal correspondente.",
        valorEstimado: 187_000,
        referencia: "DIMP — terminal fixo, 12 competências",
      },
    ],
  },
  {
    id: "nf-radar-004",
    nomeIndicado: "M.R. Serviços de TI e Automação",
    documentoMascarado: "***.***.***-27 (CPF)",
    atividadePresumida: "62.02-3 · Consultoria em tecnologia da informação",
    municipio: "Brusque",
    receitaEstimada12m: 156_000,
    detectadoEm: "2026-06-24T16:50:00Z",
    status: "novo",
    indicios: [
      {
        fonte: "nfse_terceiros",
        resumo:
          "Empresas locais registram pagamentos mensais de manutenção de sistemas ao mesmo beneficiário, que não emite NFS-e.",
        valorEstimado: 96_000,
        referencia: "Despesas recorrentes em 3 tomadores (ECD 2025)",
      },
      {
        fonte: "fonte_aberta",
        resumo:
          "Site profissional oferece contratos de suporte mensal para comércios de Brusque, com carteira divulgada de 11 clientes.",
        valorEstimado: 60_000,
        referencia: "Site institucional + diretório de empresas (06/2026)",
      },
    ],
  },
  {
    id: "nf-radar-005",
    nomeIndicado: "Transporte Escolar Tia Mel",
    documentoMascarado: "***.***.***-64 (CPF)",
    atividadePresumida: "49.24-8 · Transporte escolar",
    municipio: "Brusque",
    receitaEstimada12m: 98_000,
    detectadoEm: "2026-06-29T07:35:00Z",
    status: "novo",
    indicios: [
      {
        fonte: "fonte_aberta",
        resumo:
          "Grupos comunitários anunciam 3 rotas ativas de transporte escolar; veículo identificado sem alvará ou inscrição municipal.",
        valorEstimado: 98_000,
        referencia: "Anúncios públicos + cadastro de frota (05/2026)",
      },
    ],
  },
  {
    id: "nf-radar-006",
    nomeIndicado: "Marcenaria Sob Medida do Vale",
    documentoMascarado: "**.***.***/0001-** (CNPJ baixado)",
    atividadePresumida: "31.03-9 · Fabricação de móveis planejados",
    municipio: "Brusque",
    receitaEstimada12m: 74_000,
    detectadoEm: "2026-06-22T11:15:00Z",
    status: "novo",
    indicios: [
      {
        fonte: "meios_pagamento",
        resumo:
          "Recebimentos parcelados em maquininha associada a CNPJ baixado em 2024 continuam ativos, média de R$ 6.100/mês.",
        valorEstimado: 74_000,
        referencia: "DIMP — CNPJ baixado com fluxo ativo",
      },
    ],
  },
];
