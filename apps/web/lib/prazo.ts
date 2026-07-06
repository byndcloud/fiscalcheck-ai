/*
  Prazos do caso (T14 · módulo 4 · RF04).
  Contagem regressiva em dias com escala de alerta:
  - danger: vencido ou vence hoje;
  - warn (âmbar): vence em até 3 dias;
  - muted: folga ou sem prazo.
  Compartilhado entre Kanban, Lista e dossiê para o destaque ser idêntico.
*/

export type PrazoTone = "muted" | "warn" | "danger";

export type PrazoInfo = {
  label: string;
  tone: PrazoTone;
  /** Dias até o vencimento (negativo = vencido); null quando sem prazo. */
  diasRestantes: number | null;
  vencido: boolean;
};

export function prazoInfo(prazo?: string, now: number = Date.now()): PrazoInfo {
  if (!prazo) {
    return { label: "Sem prazo", tone: "muted", diasRestantes: null, vencido: false };
  }
  const target = new Date(`${prazo}T23:59:59`).getTime();
  const diffDays = Math.floor((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Vencido há ${Math.abs(diffDays)}d`,
      tone: "danger",
      diasRestantes: diffDays,
      vencido: true,
    };
  }
  if (diffDays === 0) {
    return { label: "Vence hoje", tone: "danger", diasRestantes: 0, vencido: false };
  }
  return {
    label: `Vence em ${diffDays}d`,
    tone: diffDays <= 3 ? "warn" : "muted",
    diasRestantes: diffDays,
    vencido: false,
  };
}
