import type { CopilotSource } from "@fiscalcheck/shared-types";

/*
  Roteiros do Copilot Fiscal (T18 — RF10/FA11, módulo 6). Respostas
  100% mockadas — cada roteiro casa por substring case-insensitive
  contra a pergunta do auditor (ver handler POST /copilot/ask em
  apps/web/mocks/handlers.ts, que também resolve a resposta contextual
  de "resumo do caso" usando casosFixture/contribuintesFixture, sem
  depender de um roteiro estático daqui).

  9 roteiros estáticos + a resposta contextual = 10 cenários cobertos,
  atendendo ao critério de aceite "8–10 perguntas roteirizadas".
  Nenhum dado real de contribuinte/legislação — tudo sintético para a
  demo (AGENTS.md §1.2).
*/
export interface CopilotScript {
  id: string;
  gatilhos: string[];
  resposta: string;
  fontes: CopilotSource[];
}

export const copilotScriptsFixture: CopilotScript[] = [
  {
    id: "cp-001",
    gatilhos: [
      "alíquota do iss",
      "aliquota do iss",
      "alíquota iss",
      "aliquota iss",
      "quanto é o iss",
    ],
    resposta:
      "A alíquota de ISS em Brusque varia de 2% a 5% conforme o serviço prestado (Lista de Serviços da LC 116/2003, internalizada pelo Código Tributário Municipal, art. 92). Serviços de informática e construção civil costumam ficar na faixa de 2–3%; os demais, na alíquota-teto de 5%.",
    fontes: [
      { label: "Código Tributário Municipal, art. 92", ref: "lei-municipal-ctm" },
      { label: "LC 116/2003 — Lista de Serviços", ref: "lc-116-2003" },
    ],
  },
  {
    id: "cp-002",
    gatilhos: ["iptu", "valor venal"],
    resposta:
      "O IPTU municipal incide sobre o valor venal do imóvel, com alíquotas de 0,6% (residencial) a 1,2% (não residencial ou terreno não edificado), conforme a Planta Genérica de Valores vigente. Imóveis de uso misto seguem a alíquota do uso predominante.",
    fontes: [{ label: "Código Tributário Municipal, art. 45", ref: "lei-municipal-ctm" }],
  },
  {
    id: "cp-003",
    gatilhos: ["itbi", "transmissão de bens", "transmissao de bens"],
    resposta:
      "O ITBI incide à alíquota de 2% sobre o valor de transmissão de bens imóveis, apurado pelo maior valor entre o de mercado e o venal. É devido pelo adquirente antes do registro no cartório de imóveis.",
    fontes: [{ label: "Código Tributário Municipal, art. 61", ref: "lei-municipal-ctm" }],
  },
  {
    id: "cp-004",
    gatilhos: [
      "como o score é calculado",
      "como o score e calculado",
      "critério de risco",
      "criterio de risco",
      "como funciona o score",
    ],
    resposta:
      "O score de risco (0–100) combina fatores ponderados — subdeclaração recorrente, vínculos societários com contribuintes suspensos, divergências NFS-e x declarado e histórico de autuações —, cada um com peso, contribuição e evidência associada. O nível de risco (conforme → crítico) deriva de faixas configuráveis pelo Gestor/Admin no Modelo de Risco.",
    fontes: [
      { label: "Módulo 3 — IA Preditiva", ref: "docs/modules/03-ia-preditiva.md" },
      { label: "Configuração do Modelo de Risco (T02)", ref: "/modelo-de-risco" },
    ],
  },
  {
    id: "cp-005",
    gatilhos: ["fatores de risco", "xai", "explicabilidade", "por que esse contribuinte"],
    resposta:
      "Cada fator de risco traz nome, peso (0–1), contribuição ao score final e a evidência que o embasa (ex.: '3 competências abaixo da média setorial'), além da origem — cruzamento fiscal, análise de grafo societário, cadastro ou histórico. Isso permite ao auditor validar a recomendação antes de decidir.",
    fontes: [{ label: "Módulo 3 — IA Preditiva", ref: "docs/modules/03-ia-preditiva.md" }],
  },
  {
    id: "cp-006",
    gatilhos: [
      "simples nacional",
      "regime tributário",
      "regime tributario",
      "lucro presumido",
      "lucro real",
    ],
    resposta:
      "Contribuintes no Simples Nacional recolhem ISS pela alíquota efetiva da tabela do anexo correspondente, não pela alíquota municipal cheia; Lucro Presumido e Lucro Real seguem a alíquota municipal direta por serviço prestado. O regime cadastral do contribuinte está sempre disponível na seção 'Contribuinte' do dossiê do caso.",
    fontes: [{ label: "LC 123/2006 — Simples Nacional", ref: "lc-123-2006" }],
  },
  {
    id: "cp-007",
    gatilhos: [
      "prazo de intimação",
      "prazo de intimacao",
      "quantos dias tem o contribuinte",
      "prazo para responder",
    ],
    resposta:
      "O prazo padrão de resposta a uma intimação fiscal municipal é de 10 (dez) dias úteis, contados da ciência do contribuinte. Para autorregularização, o prazo usual concedido é de 15 dias úteis a partir da notificação — ambos configuráveis por tributo e gravidade da divergência.",
    fontes: [{ label: "Código Tributário Municipal, art. 178", ref: "lei-municipal-ctm" }],
  },
  {
    id: "cp-008",
    gatilhos: ["autorregularização", "autorregularizacao", "como funciona a autorregularização"],
    resposta:
      "Na autorregularização, o contribuinte recebe notificação multicanal com o apontamento e um prazo para retificar declarações e recolher a diferença com os acréscimos legais, sem abertura de processo formal de fiscalização. Se o prazo expirar sem regularização, o caso é reclassificado para fiscalização.",
    fontes: [
      { label: "Módulo 4 — Gestão da Fiscalização", ref: "docs/modules/04-gestao-fiscalizacao.md" },
    ],
  },
  {
    id: "cp-009",
    gatilhos: [
      "histórico do contribuinte",
      "historico do contribuinte",
      "casos anteriores",
      "já teve outro caso",
    ],
    resposta:
      "Consigo trazer o histórico de casos de um contribuinte específico se você abrir o Copilot a partir do dossiê dele (chip 'Contexto: CS-...') ou encontrá-lo pela busca global — a partir daí eu resumo status, score e casos relacionados.",
    fontes: [],
  },
];

export const COPILOT_FALLBACK_RESPOSTA =
  "Ainda não tenho um roteiro para essa pergunta. Tente perguntar sobre alíquotas (ISS, IPTU, ITBI), critérios do score de risco, prazos de intimação/autorregularização ou o histórico de um contribuinte específico.";

export const COPILOT_SUGESTOES_PADRAO: string[] = [
  "Qual a alíquota do ISS?",
  "Como o score de risco é calculado?",
  "Como funciona a autorregularização?",
];
