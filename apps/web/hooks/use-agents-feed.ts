"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";

import { type PipelineAgent, getInitialAgents, tickAgents } from "@/lib/mocks/agents";

const REFETCH_INTERVAL_MS = 4_000;

/**
 * Feed mockado da esteira de agentes (T10). O estado da simulação fica num
 * ref local (não em módulo global) para não vazar entre testes/instâncias;
 * a cada refetch avança um "tick" e, se algum agente entrar em erro,
 * dispara um toast (sonner) informando o auditor. O queryFn roda uma vez
 * por intervalo independente do nº de assinantes da query, então o toast
 * nunca duplica mesmo com múltiplos componentes lendo `useAgentsFeed`.
 */
export function useAgentsFeed() {
  const agentsRef = useRef<PipelineAgent[]>(getInitialAgents());

  return useQuery({
    queryKey: ["agents-feed"],
    queryFn: () => {
      const { agents, novosErros } = tickAgents(agentsRef.current);
      agentsRef.current = agents;
      for (const erro of novosErros) {
        toast.error(erro.mensagem, {
          description: `${erro.agentId} · ${erro.agentNome}`,
        });
      }
      return agents;
    },
    initialData: () => agentsRef.current,
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: 0,
  });
}
