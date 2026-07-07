"use client";

import { InfoIcon, MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useRef, useState } from "react";

import type { NetworkEdge, NetworkNode } from "@fiscalcheck/shared-types";

import {
  EDGE_COLOR,
  EDGE_DASH,
  EDGE_TIPO_LABEL,
  NODE_COLOR,
  NODE_TIPO_LABEL,
} from "@/components/network/network-labels";
import { Button } from "@/components/ui/button";

/*
  Canvas do grafo (T12) — SVG puro, sem lib externa (ADR-0005 rejeitou
  D3; o volume de nós do POC não justifica dependência nova).
  Zoom por botões (transform no <g> ao redor do centro do viewBox);
  nó = entidade, linha = vínculo, raio = score de risco de rede.
  Cada nó é focável por teclado e clicável (aceite: abre o detalhe).

  Rótulos de aresta (percentuais, R$/mês) e score do nó saíram do canvas
  para um balão de hover/focus — sempre visíveis eles colidiam com os
  nomes dos nós em comunidades densas.
*/

type Props = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: NetworkNode) => void;
};

type TooltipState = {
  left: number;
  top: number;
  title: string;
  subtitle: string;
  lines: string[];
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.4;
const MAX_LABEL_CHARS = 24;

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label;
}

export function NetworkGraph({ nodes, edges, selectedNodeId, onSelectNode }: Props) {
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const visibleEdges = edges.filter((e) => nodeById.has(e.origem) && nodeById.has(e.destino));

  /* Posição do balão relativa ao container, com clamp horizontal para o
     balão não vazar do canvas nas bordas. */
  const placeTooltip = (
    clientX: number,
    clientY: number,
    content: Omit<TooltipState, "left" | "top">,
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(clientX - rect.left, 72), rect.width - 72);
    const top = Math.max(clientY - rect.top - 10, 8);
    setTooltip({ left, top, ...content });
  };

  const nodeTooltipContent = (node: NetworkNode): Omit<TooltipState, "left" | "top"> => ({
    title: node.label,
    subtitle: NODE_TIPO_LABEL[node.tipo],
    lines: [
      ...(node.documento ? [node.documento] : []),
      `Score de rede: ${node.scoreRede}`,
      `Ligações com autuados: ${node.ligacoesAutuados}`,
    ],
  });

  const edgeTooltipContent = (edge: NetworkEdge): Omit<TooltipState, "left" | "top"> => {
    const origem = nodeById.get(edge.origem);
    const destino = nodeById.get(edge.destino);
    return {
      title: EDGE_TIPO_LABEL[edge.tipo],
      subtitle:
        origem && destino ? `${truncateLabel(origem.label)} ↔ ${truncateLabel(destino.label)}` : "",
      lines: edge.rotulo ? [edge.rotulo] : [],
    };
  };

  /* Foco por teclado não tem coordenada de mouse: ancora o balão no
     próprio elemento SVG focado. */
  const placeTooltipAtElement = (target: Element, content: Omit<TooltipState, "left" | "top">) => {
    const rect = target.getBoundingClientRect();
    placeTooltip(rect.left + rect.width / 2, rect.top, content);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[var(--r-md)] bg-[radial-gradient(900px_400px_at_50%_30%,var(--n-25),var(--surface))]"
    >
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
                {/* Área de hover invisível e mais larga: revela o balão com
                    tipo do vínculo e rótulo (ex.: "R$ 41 mil/mês"). */}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth={2.4}
                  className="cursor-help"
                  onMouseEnter={(e) => placeTooltip(e.clientX, e.clientY, edgeTooltipContent(edge))}
                  onMouseMove={(e) => placeTooltip(e.clientX, e.clientY, edgeTooltipContent(edge))}
                  onMouseLeave={() => setTooltip(null)}
                />
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
                onMouseEnter={(e) => placeTooltip(e.clientX, e.clientY, nodeTooltipContent(node))}
                onMouseMove={(e) => placeTooltip(e.clientX, e.clientY, nodeTooltipContent(node))}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(e) => placeTooltipAtElement(e.currentTarget, nodeTooltipContent(node))}
                onBlur={() => setTooltip(null)}
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
                  {truncateLabel(node.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-[var(--r-md)] border border-border bg-surface px-3 py-2 shadow-[var(--e-2)]"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          <p className="text-xs font-bold leading-snug text-text-strong">{tooltip.title}</p>
          {tooltip.subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {tooltip.subtitle}
            </p>
          ) : null}
          {tooltip.lines.map((line) => (
            <p
              key={line}
              className="mt-0.5 font-data text-[11px] font-semibold leading-snug text-foreground"
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

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
