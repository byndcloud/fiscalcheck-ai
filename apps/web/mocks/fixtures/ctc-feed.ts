import type { CtcAlert, CtcBatch, CtcFeed } from "@fiscalcheck/shared-types";

/*
  Feed de Monitoramento Contínuo CTC (T07 · módulo 2 · RF09/FA10).

  Simulação em quase tempo real SEM aleatoriedade: os lotes são gerados
  deterministicamente a partir do `seq` conforme o relógio avança
  (1 lote a cada BATCH_INTERVAL_MS). O front consulta com
  refetchInterval e o feed "anda sozinho".

  Todos os contribuintes citados são os sintéticos do fixture de
  cadastro (AGENTS.md §1.2 — sigilo fiscal).
*/

export const BATCH_INTERVAL_MS = 8_000;
const MAX_BATCHES = 18;
const SEED_BATCHES = 8;

/** Regras de monitoramento contínuo — o alerta sempre cita a que disparou. */
export const CTC_RULES: readonly { regra: string; descricao: string }[] = [
  {
    regra: "Salto de faturamento na competência",
    descricao:
      "Soma de NFS-e do mês superou em 3× a média móvel de 6 meses do prestador sem mudança cadastral que justifique.",
  },
  {
    regra: "Prestador suspenso emitindo NFS-e",
    descricao:
      "Nota recebida de inscrição municipal com situação suspensa no cadastro mobiliário — atividade incompatível com o status.",
  },
  {
    regra: "Alíquota incompatível com o item de serviço",
    descricao:
      "Alíquota destacada na NFS-e diverge da prevista na lista de serviços para o item informado.",
  },
  {
    regra: "Fracionamento de notas no mesmo tomador",
    descricao:
      "Sequência de NFS-e de baixo valor para o mesmo tomador em janela curta — padrão de fragmentação artificial.",
  },
  {
    regra: "Tomador recorrente fora do município",
    descricao:
      "Concentração atípica de notas para tomadores de outros municípios com ISS retido divergente da regra de local da prestação.",
  },
];

const ALERT_TAXPAYERS: readonly { id: string; nome: string }[] = [
  { id: "ct-001", nome: "Metalúrgica Nova Aurora Ltda." },
  { id: "ct-007", nome: "Restaurante Coração Catarinense Ltda." },
  { id: "ct-013", nome: "Distribuidora Rio Grande de Bebidas S.A." },
  { id: "ct-019", nome: "Estilo Sul Comércio Varejista de Vestuário S.A." },
  { id: "ct-021", nome: "Confecções Brusque Style Ltda." },
  { id: "ct-004", nome: "Prestadora de Serviços Ícaro ME" },
];

function buildBatch(seq: number, recebidoEmMs: number): CtcBatch {
  const notas = 6 + ((seq * 7) % 34);
  const ticketMedio = 1_800 + ((seq * 137) % 2_400);
  const hasAlert = seq % 3 === 0;

  let alerta: CtcAlert | undefined;
  if (hasAlert) {
    const rule = CTC_RULES[(seq / 3) % CTC_RULES.length] ?? CTC_RULES[0];
    const taxpayer = ALERT_TAXPAYERS[seq % ALERT_TAXPAYERS.length] ?? ALERT_TAXPAYERS[0];
    if (rule && taxpayer) {
      alerta = {
        id: `ctc-al-${String(seq).padStart(4, "0")}`,
        regra: rule.regra,
        descricao: rule.descricao,
        contribuinteId: taxpayer.id,
        contribuinteNome: taxpayer.nome,
        janelaMinutos: 4 + ((seq * 5) % 25),
        scoreIncremental: 55 + ((seq * 9) % 40),
        sugestaoEnviada: false,
      };
    }
  }

  return {
    id: `ctc-lote-${String(seq).padStart(4, "0")}`,
    seq,
    recebidoEm: new Date(recebidoEmMs).toISOString(),
    notas,
    valorTotal: notas * ticketMedio,
    regrasAvaliadas: CTC_RULES.length * 3,
    processamentoSegundos: 1.5 + (seq % 5) * 0.7,
    alerta,
  };
}

type CtcState = {
  batches: CtcBatch[];
  nextSeq: number;
  lastGeneratedAt: number;
};

function seedState(now: number): CtcState {
  const batches: CtcBatch[] = [];
  for (let i = 0; i < SEED_BATCHES; i += 1) {
    const seq = i + 1;
    batches.push(buildBatch(seq, now - (SEED_BATCHES - i) * BATCH_INTERVAL_MS));
  }
  return { batches, nextSeq: SEED_BATCHES + 1, lastGeneratedAt: now };
}

let state: CtcState | null = null;

/** Avança a simulação até `now` e devolve o feed agregado (mais recente primeiro). */
export function getCtcFeed(now = Date.now()): CtcFeed {
  if (!state) state = seedState(now);

  while (now - state.lastGeneratedAt >= BATCH_INTERVAL_MS) {
    state.lastGeneratedAt += BATCH_INTERVAL_MS;
    state.batches.push(buildBatch(state.nextSeq, state.lastGeneratedAt));
    state.nextSeq += 1;
  }
  if (state.batches.length > MAX_BATCHES) {
    state.batches = state.batches.slice(-MAX_BATCHES);
  }

  const lotes = [...state.batches].reverse();
  const alertas = lotes.flatMap((l) => (l.alerta ? [l.alerta] : []));
  const janelaMedia =
    alertas.length > 0
      ? Math.round((alertas.reduce((acc, a) => acc + a.janelaMinutos, 0) / alertas.length) * 10) /
        10
      : 0;

  return {
    atualizadoEm: new Date(now).toISOString(),
    janelaMediaMinutos: janelaMedia,
    totalNotas: lotes.reduce((acc, l) => acc + l.notas, 0),
    totalAlertas: alertas.length,
    lotes,
  };
}

/** Localiza um alerta ativo no feed (para o POST de sugestão). */
export function findCtcAlert(alertId: string): CtcAlert | undefined {
  if (!state) return undefined;
  for (const batch of state.batches) {
    if (batch.alerta?.id === alertId) return batch.alerta;
  }
  return undefined;
}

/** Reset do estado — usado apenas em testes. */
export function resetCtcFeedForTests(): void {
  state = null;
}
