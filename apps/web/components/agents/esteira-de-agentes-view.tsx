"use client";

import { useState } from "react";

import { AgentCard } from "@/components/agents/agent-card";
import { AgentDetailSheet } from "@/components/agents/agent-detail-sheet";
import { AgentFlowBar } from "@/components/agents/agent-flow-bar";
import { AgentsSummaryCards } from "@/components/agents/agents-summary-cards";
import { useAgentsFeed } from "@/hooks/use-agents-feed";

export function EsteiraDeAgentesView() {
  const { data: agents = [] } = useAgentsFeed();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;

  return (
    <main className="container mx-auto space-y-6 p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Esteira de agentes</h1>
        <p className="text-muted-foreground">
          Observabilidade dos agentes especialistas (FA01–FA11): status, fila e tempo médio
          atualizados em tempo real.
        </p>
      </header>

      <AgentFlowBar />

      <AgentsSummaryCards agents={agents} />

      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-label="Lista de agentes especialistas"
      >
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={setSelectedAgentId} />
        ))}
      </section>

      <AgentDetailSheet
        agent={selectedAgent}
        onOpenChange={(open) => {
          if (!open) setSelectedAgentId(null);
        }}
      />
    </main>
  );
}
