"use client";

import { InfoIcon, MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";

import type { NetworkEdge, NetworkNode } from "@fiscalcheck/shared-types";

import { EDGE_COLOR, EDGE_DASH, NODE_COLOR } from "@/components/network/network-labels";
import { Button } from "@/components/ui/button";

/*
  Canvas do grafo (T12) — SVG puro, sem lib externa (ADR-0005 rejeitou
  D3; o volume de nós do POC não justifica dependência nova).
  Zoom por botões (transform no <g> ao redor do centro do viewBox);
  nó = entidade, linha = vínculo, raio = score de risco de rede.
  Cada nó é focável por teclado e clicável (aceite: abre o detalhe).
*/

type Props = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: NetworkNode) => void;
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.4;

export function NetworkGraph({ nodes, edges, selectedNodeId, onSelectNode }: Props) {
  const [zoom, setZoom] = useState(1);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const visibleEdges = edges.filter((e) => nodeById.has(e.origem) && nodeById.has(e.destino));

  return (
    <div className="relative overflow-hidden rounded-[var(--r-md)] bg-[radial-gradient(900px_400px_at_50%_30%,var(--n-25),var(--surface))]">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Grafo da comunidade suspeita: nós são entidades, linhas são vínculos"
        className="block h-[480px] w-full"
      >
        <g transform={`translate(50 50) scale(${zoom}) translate(-50 -50)`}>
          {visibleEdges.map((edge) => {
            const a = nodeById.get(edge.origem);
            const b = nodeById.get(edge.destino);
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={edge.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={EDGE_COLOR[edge.tipo]}
                  strokeWidth={0.55}
                  strokeDasharray={EDGE_DASH[edge.tipo]}
                  opacity={0.85}
                />
                {edge.rotulo ? (
                  <text
                    x={midX}
                    y={midY - 1}
                    textAnchor="middle"
                    className="fill-[var(--t-muted)]"
                    style={{ fontSize: 2.1, fontFamily: "var(--font-data, monospace)" }}
                  >
                    {edge.rotulo}
                  </text>
                ) : null}
              </g>
            );
          })}

          {nodes.map((node) => {
            const r = 2.6 + (node.scoreRede / 100) * 2.6;
            const selected = node.id === selectedNodeId;
            return (
              <g
                key={node.id}
                // biome-ignore lint/a11y/useSemanticElements: não existe <button> dentro de SVG — <g role=button> é o padrão acessível para nós de grafo
                role="button"
                tabIndex={0}
                aria-label={`${node.label} — score de rede ${node.scoreRede}. Abrir detalhe.`}
                className="cursor-pointer outline-none"
                onClick={() => onSelectNode(node)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectNode(node);
                  }
                }}
              >
                {selected ? (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 1.4}
                    fill="none"
                    stroke="var(--c-aurora-to)"
                    strokeWidth={0.7}
                  />
                ) : null}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={NODE_COLOR[node.tipo]}
                  opacity={0.92}
                  stroke="var(--surface)"
                  strokeWidth={0.5}
                />
                <text
                  x={node.x}
                  y={node.y + r + 3}
                  textAnchor="middle"
                  className="fill-[var(--t-strong)]"
                  style={{ fontSize: 2.5, fontWeight: 700 }}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + r + 5.6}
                  textAnchor="middle"
                  className="fill-[var(--t-muted)]"
                  style={{ fontSize: 2, fontFamily: "var(--font-data, monospace)" }}
                >
                  score {node.scoreRede}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-pill border border-border bg-surface/90 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
        <InfoIcon aria-hidden="true" className="size-3.5 text-brand" />
        Nó = entidade · linha = vínculo · tamanho = score de risco
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-1" aria-label="Controles de zoom">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Aproximar"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + 0.2) * 10) / 10))}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Afastar"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - 0.2) * 10) / 10))}
        >
          <MinusIcon aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Restaurar zoom"
          onClick={() => setZoom(1)}
        >
          <RotateCcwIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
