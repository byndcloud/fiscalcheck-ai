"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import { type PipelineAgent, getInitialAgents, tickAgents } from "@/lib/mocks/agents";
import { useNotificationsStore } from "@/stores/notifications-store";

const REFETCH_INTERVAL_MS = 4_000;

/**
 * Feed mockado da esteira de agentes (T10). O estado da simulação fica num
 * ref local (não em módulo global) para não vazar entre testes/instâncias;
 * a cada refetch avança um "tick" e, se algum agente entrar em erro,
 * dispara o alerta no sino (T01). O queryFn roda uma vez por intervalo
 * independente do nº de assinantes da query, então a notificação nunca
 * duplica mesmo com múltiplos componentes lendo `useAgentsFeed`.
 */
export function useAgentsFeed() {
  const agentsRef = useRef<PipelineAgent[]>(getInitialAgents());
  const addNotification = useNotificationsStore((state) => state.addNotification);

  return useQuery({
    queryKey: ["agents-feed"],
    queryFn: () => {
      const { agents, novosErros } = tickAgents(agentsRef.current);
      agentsRef.current = agents;
      for (const erro of novosErros) {
        addNotification(erro);
      }
      return agents;
    },
    initialData: () => agentsRef.current,
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: 0,
  });
}
