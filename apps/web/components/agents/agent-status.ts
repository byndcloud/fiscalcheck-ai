import type { AgentStatus, ExecutionEventType } from "@/lib/mocks/agents";

/**
 * Metadados visuais de status, compartilhados entre card, sheet de detalhe
 * e cards de resumo — fonte única para não divergir cor/rótulo entre telas.
 *
 * animationClassName: DS §6 só documenta um anel pulsante dedicado
 * (fc-pulse-green) para o agente "ativo"; ocioso/erro caem no animate-pulse
 * genérico do Tailwind por não terem uma animação própria especificada.
 */
export const AGENT_STATUS_META: Record<
  AgentStatus,
  { label: string; dotClassName: string; animationClassName: string }
> = {
  ativo: { label: "Ativo", dotClassName: "bg-success", animationClassName: "fc-pulse-green" },
  ocioso: { label: "Ocioso", dotClassName: "bg-n-400", animationClassName: "animate-pulse" },
  erro: { label: "Erro", dotClassName: "bg-destructive", animationClassName: "animate-pulse" },
};

export const EXECUTION_EVENT_META: Record<
  ExecutionEventType,
  { label: string; dotClassName: string }
> = {
  sucesso: { label: "Sucesso", dotClassName: "bg-success" },
  erro: { label: "Erro", dotClassName: "bg-destructive" },
  info: { label: "Info", dotClassName: "bg-info" },
};
