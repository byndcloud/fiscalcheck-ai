import type { TrainingCase, TrainingGabarito } from "@fiscalcheck/shared-types";

/*
  Biblioteca de casos-exercício (T20 · RSC04 · módulo 6).

  Cada exercício é uma versão ANONIMIZADA de um padrão real de
  fiscalização: contribuintes viram codinomes (Alfa, Bravo, …), CNPJs
  são mascarados e valores foram alterados. O gabarito reproduz a
  decisão histórica do auditor experiente + o desfecho do caso.

  O campo `gabarito`/`aprendizado` fica FORA do TrainingCaseSchema
  público de propósito — o handler só o revela após a tentativa.
*/

export type TrainingCaseSeed = Omit<TrainingCase, "tentativa"> & {
  gabarito: TrainingGabarito;
  aprendizado: string;
};

export const trainingCasesFixture: readonly TrainingCaseSeed[] = [
  {
    id: "tr-001",
    titulo: "Notas emitidas acima do declarado no PGDAS",
    dificuldade: "iniciante",
    contribuinte: {
      codinome: "Contribuinte Alfa",
      cnpjMascarado: "**.***.***/0001-**",
      atividade: "Serviços de limpeza e conservação",
      regime: "Simples Nacional",
    },
    contexto:
      "O cruzamento mensal apontou que as NFS-e emitidas pelo Contribuinte Alfa somam valor 38% maior do que a receita declarada no PGDAS-D da mesma competência. O padrão se repete há 3 meses consecutivos, sempre com diferença crescente. O contribuinte nunca foi notificado antes e não há contestações registradas.",
    divergencia: {
      tipo: "subdeclaracao",
      resumo: "NFS-e somam R$ 84.300 contra R$ 61.000 declarados (3 competências).",
      valorDeclarado: 61000,
      valorApurado: 84300,
      competencia: "2026-03",
    },
    scoreValor: 78,
    fatoresResumo: [
      "Diferença declarado × NFS-e recorrente (+3 competências)",
      "Tendência de crescimento da diferença mês a mês",
      "Sem histórico de autorregularização anterior",
    ],
    recomendacaoAgente:
      "Notificar para autorregularização antes de abrir fiscalização — padrão compatível com erro de apuração, não com fraude estruturada.",
    gabarito: {
      acao: "aprovar",
      justificativa:
        "Divergência recorrente e bem evidenciada por NFS-e, mas sem indício de dolo. A notificação para autorregularização é a medida proporcional: dá chance de correção espontânea com multa reduzida (art. 138 do CTN).",
      resultado:
        "O contribuinte aderiu à autorregularização em 12 dias e recolheu R$ 23.300 de diferença + acréscimos legais, sem abertura de processo fiscal.",
    },
    aprendizado:
      "Subdeclaração recorrente sem sinal de fraude pede o caminho menos gravoso primeiro. A denúncia espontânea (art. 138 do CTN) recupera o valor mais rápido e com menor custo administrativo do que uma fiscalização completa.",
  },
  {
    id: "tr-002",
    titulo: "Prestador ativo sem nenhuma declaração no período",
    dificuldade: "iniciante",
    contribuinte: {
      codinome: "Contribuinte Bravo",
      cnpjMascarado: "**.***.***/0001-**",
      atividade: "Desenvolvimento de software sob encomenda",
      regime: "Simples Nacional",
    },
    contexto:
      "O Contribuinte Bravo emitiu 47 NFS-e no semestre — tomadores idôneos, valores compatíveis com o porte — mas não entregou nenhuma declaração mensal no período. O cadastro está ativo e o endereço confirmado. Tentativas de contato telefônico do setor de cobrança não tiveram retorno.",
    divergencia: {
      tipo: "omissao",
      resumo: "47 NFS-e emitidas (R$ 112.400) sem nenhuma declaração no semestre.",
      valorDeclarado: 0,
      valorApurado: 112400,
      competencia: "2026-01",
    },
    scoreValor: 86,
    fatoresResumo: [
      "Omissão total de declaração com atividade comprovada por NFS-e",
      "Não retorno aos contatos do setor de cobrança",
      "Valor apurado relevante para o porte declarado",
    ],
    recomendacaoAgente:
      "Emitir intimação formal com prazo de 10 dias — a omissão total com atividade comprovada exige constituição formal do crédito se não houver resposta.",
    gabarito: {
      acao: "aprovar",
      justificativa:
        "Omissão total não é erro de apuração: é descumprimento de obrigação acessória com tributo devido comprovado por documento fiscal próprio. A intimação formal interrompe a espontaneidade e prepara o lançamento de ofício.",
      resultado:
        "Sem resposta à intimação, foi aberta fiscalização e lançado o crédito integral com multa de ofício. O contribuinte parcelou o débito após a ciência do auto.",
    },
    aprendizado:
      "Omissão total muda o enquadramento: o caminho suave da autorregularização perde força quando o contribuinte ignora os canais de contato. A intimação formal protege o prazo decadencial e formaliza a mora.",
  },
  {
    id: "tr-003",
    titulo: "Score alto puxado por um único fator de rede",
    dificuldade: "intermediario",
    contribuinte: {
      codinome: "Contribuinte Charlie",
      cnpjMascarado: "**.***.***/0001-**",
      atividade: "Consultoria em gestão empresarial",
      regime: "Lucro Presumido",
    },
    contexto:
      "O Contribuinte Charlie apareceu na fila com score 81, quase todo explicado por um único fator: um sócio minoritário (8% de participação) também integra o quadro de uma empresa com débito inscrito em dívida ativa. As declarações do Charlie estão em dia e batem com as NFS-e emitidas nos últimos 12 meses.",
    divergencia: {
      tipo: "socio_vinculado",
      resumo: "Sócio com 8% de participação vinculado a empresa com débito inscrito.",
      valorDeclarado: 45200,
      valorApurado: 45200,
      competencia: "2026-04",
    },
    scoreValor: 81,
    fatoresResumo: [
      "Sócio vinculado a empresa com débito em dívida ativa (+42 pts)",
      "Declarações e NFS-e consistentes há 12 meses (−8 pts)",
      "Cadastro atualizado e sem alterações societárias recentes (−4 pts)",
    ],
    recomendacaoAgente:
      "Notificar para esclarecimentos sobre o vínculo societário antes de qualquer medida.",
    gabarito: {
      acao: "rejeitar",
      justificativa:
        "As obrigações próprias do contribuinte estão íntegras: declarado bate com apurado. Vínculo societário minoritário com terceiro devedor não é fato gerador nem indício de infração própria — acionar o contribuinte seria fiscalização sem objeto e desgastaria a relação com um contribuinte adimplente.",
      resultado:
        "Caso arquivado com registro do motivo. O fator de rede foi recalibrado no modelo (peso reduzido para participações minoritárias), reduzindo falsos positivos semelhantes em 30%.",
    },
    aprendizado:
      "Score alto não é sinônimo de caso procedente. Leia os fatores de explicabilidade: quando um único fator de rede domina e as obrigações próprias estão em dia, a decisão correta pode ser rejeitar e alimentar a recalibragem do modelo (human-in-the-loop).",
  },
  {
    id: "tr-004",
    titulo: "Faturamento acima do sublimite do Simples",
    dificuldade: "intermediario",
    contribuinte: {
      codinome: "Contribuinte Delta",
      cnpjMascarado: "**.***.***/0001-**",
      atividade: "Transporte escolar e fretamento",
      regime: "Simples Nacional",
    },
    contexto:
      "As NFS-e do Contribuinte Delta indicam receita acumulada de R$ 4,1 milhões nos últimos 12 meses — acima do sublimite estadual do Simples Nacional para recolhimento de ISS dentro do regime. O contribuinte segue declarando integralmente pelo PGDAS-D, sem destacar o ISS fora do Simples.",
    divergencia: {
      tipo: "regime_incorreto",
      resumo:
        "Receita acumulada de R$ 4,1 mi ultrapassa o sublimite; ISS deveria ser apurado fora do Simples.",
      valorDeclarado: 3600000,
      valorApurado: 4100000,
      competencia: "2026-02",
    },
    scoreValor: 72,
    fatoresResumo: [
      "Receita acumulada acima do sublimite estadual",
      "Recolhimento de ISS ainda integral no PGDAS-D",
      "Histórico de declarações pontuais nos demais meses",
    ],
    recomendacaoAgente:
      "Ajustar a recomendação: notificar com orientação específica sobre a transição de regime, em vez de intimação imediata.",
    gabarito: {
      acao: "ajustar",
      justificativa:
        "Há infração objetiva (regime incorreto), mas o histórico de conformidade sugere desconhecimento da regra do sublimite — cenário comum. A notificação orientativa com prazo para recolhimento complementar educa e recupera; a intimação seca geraria contencioso desnecessário.",
      resultado:
        "Após a notificação orientativa, o contribuinte regularizou a apuração em 20 dias e passou a recolher o ISS fora do Simples. Diferença recuperada sem litígio.",
    },
    aprendizado:
      "Nem toda infração pede a medida mais dura. A regra do sublimite é tecnicamente complexa e o erro de boa-fé é frequente: ajustar a comunicação para o tom orientativo maximiza a arrecadação e minimiza o contencioso.",
  },
  {
    id: "tr-005",
    titulo: "Endereço divergente entre cadastro e notas",
    dificuldade: "avancado",
    contribuinte: {
      codinome: "Contribuinte Echo",
      cnpjMascarado: "**.***.***/0001-**",
      atividade: "Serviços de estética e bem-estar",
      regime: "MEI",
    },
    contexto:
      "O Contribuinte Echo está cadastrado em endereço residencial, mas as NFS-e trazem local de prestação num imóvel comercial de outro bairro, onde funciona um salão com 6 profissionais — porte incompatível com MEI. O grafo de vínculos mostra outros 2 MEIs cadastrados no mesmo imóvel comercial, todos emitindo para os mesmos tomadores.",
    divergencia: {
      tipo: "endereco_inconsistente",
      resumo:
        "Local de prestação difere do cadastro; imóvel concentra 3 MEIs com os mesmos tomadores.",
      valorDeclarado: 6750,
      valorApurado: 28900,
      competencia: "2026-03",
    },
    scoreValor: 91,
    fatoresResumo: [
      "Endereço de prestação divergente do cadastro mobiliário",
      "3 MEIs no mesmo imóvel emitindo para os mesmos tomadores",
      "Receita conjunta incompatível com o teto do MEI",
    ],
    recomendacaoAgente:
      "Abrir fiscalização com diligência in loco — padrão compatível com fracionamento artificial de empresa (pejotização de estabelecimento).",
    gabarito: {
      acao: "aprovar",
      justificativa:
        "Os três indícios convergem para fracionamento artificial: um estabelecimento único operando através de múltiplos MEIs para permanecer sob o teto. Isso não se resolve por notificação — exige verificação in loco e caracterização formal do estabelecimento único.",
      resultado:
        "A diligência confirmou estabelecimento único. Os MEIs foram desenquadrados de ofício, com lançamento retroativo do ISS sobre a receita consolidada.",
    },
    aprendizado:
      "Divergência de endereço isolada costuma ser cadastral. O que muda o jogo é a convergência de indícios no grafo (mesmo imóvel + mesmos tomadores + teto do MEI). Casos de estruturação artificial exigem prova material — por isso a fiscalização in loco é a medida certa.",
  },
  {
    id: "tr-006",
    titulo: "Pico isolado de emissão em contribuinte regular",
    dificuldade: "avancado",
    contribuinte: {
      codinome: "Contribuinte Foxtrot",
      cnpjMascarado: "**.***.***/0001-**",
      atividade: "Produção de eventos corporativos",
      regime: "Lucro Presumido",
    },
    contexto:
      "O Contribuinte Foxtrot declarou 5x mais em março do que sua média histórica, e as NFS-e confirmam o valor. O motor sinalizou anomalia estatística (desvio > 4σ). Analisando as notas, todas se referem a um único evento de grande porte realizado no município — um congresso nacional que aconteceu em março, fato público e notório.",
    divergencia: {
      tipo: "subdeclaracao",
      resumo:
        "Anomalia estatística: receita 5x acima da média histórica em março (declaração e NFS-e consistentes).",
      valorDeclarado: 385000,
      valorApurado: 385000,
      competencia: "2026-03",
    },
    scoreValor: 69,
    fatoresResumo: [
      "Desvio estatístico > 4σ sobre a média móvel de 12 meses",
      "Declaração e NFS-e consistentes entre si (−12 pts)",
      "Tomador único identificado e idôneo (−6 pts)",
    ],
    recomendacaoAgente:
      "Notificar para esclarecimento do pico de receita antes de qualquer enquadramento.",
    gabarito: {
      acao: "rejeitar",
      justificativa:
        "A anomalia tem explicação econômica verificável: evento único, público e notório, com tomador idôneo e documentação fiscal consistente. Declarado = apurado. Não há divergência tributária — apenas variação legítima de receita. Notificar seria custo administrativo sem objeto.",
      resultado:
        "Caso arquivado. A regra de anomalia ganhou uma exceção para eventos sazonais registrados no calendário oficial do município, evitando alertas repetidos em cenários legítimos.",
    },
    aprendizado:
      "Anomalia estatística mede surpresa, não infração. Antes de acionar o contribuinte, procure a explicação econômica do desvio — quando declaração e notas batem e o contexto justifica o pico, o arquivamento com registro de motivo é a decisão que protege o modelo e o contribuinte.",
  },
];
