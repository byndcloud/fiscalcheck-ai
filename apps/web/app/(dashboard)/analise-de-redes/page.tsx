"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, Share2Icon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { NetworkEdgeTipo, NetworkNode, NetworkScenario } from "@fiscalcheck/shared-types";

import { NetworkGraph } from "@/components/network/network-graph";
import {
  EDGE_COLOR,
  EDGE_DASH,
  EDGE_TIPO_LABEL,
  ESQUEMA_LABEL,
  NODE_COLOR,
  NODE_TIPO_LABEL,
} from "@/components/network/network-labels";
import { NodeDrawer } from "@/components/network/node-drawer";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/*
  Análise de Redes / Graph Analytics (T12 · módulo 3 · RF08/FA09).

  Grafo interativo por comunidade suspeita: filtros combináveis
  (comunidade, período, tipo de vínculo, profundidade), drawer do nó com
  resolução de entidades e risco de rede, painel de padrões detectados +
  recomendação do agente, e a biblioteca dos 5 cenários abaixo do canvas
  (clicar num cenário troca o grafo).
*/

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const EDGE_TIPOS = Object.keys(EDGE_TIPO_LABEL) as NetworkEdgeTipo[];

export default function AnaliseDeRedesPage() {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("todos");
  const [tiposVinculo, setTiposVinculo] = useState<NetworkEdgeTipo[]>([...EDGE_TIPOS]);
  const [profundidade, setProfundidade] = useState<"1" | "2">("2");
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const query = useQuery({
    queryKey: ["network", "scenarios"],
    queryFn: () => apiRequest<NetworkScenario[]>("/network/scenarios"),
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });

  const scenarios = useMemo(() => query.data ?? [], [query.data]);

  const periodos = useMemo(() => [...new Set(scenarios.map((s) => s.periodo))].sort(), [scenarios]);

  const visiveis = useMemo(
    () => (periodo === "todos" ? scenarios : scenarios.filter((s) => s.periodo === periodo)),
    [scenarios, periodo],
  );

  const scenario = visiveis.find((s) => s.id === scenarioId) ?? visiveis[0] ?? scenarios[0] ?? null;

  /*
    Profundidade: nível 1 = nó articulador (maior score de rede) e seus
    vizinhos diretos; nível 2 = comunidade completa.
  */
  const { nodes, edges } = useMemo(() => {
    if (!scenario) return { nodes: [], edges: [] };
    const edgesByTipo = scenario.vinculos.filter((v) => tiposVinculo.includes(v.tipo));
    if (profundidade === "2") return { nodes: scenario.nos, edges: edgesByTipo };

    const central = [...scenario.nos].sort((a, b) => b.scoreRede - a.scoreRede)[0];
    if (!central) return { nodes: scenario.nos, edges: edgesByTipo };
    const vizinhos = new Set<string>([central.id]);
    for (const v of scenario.vinculos) {
      if (v.origem === central.id) vizinhos.add(v.destino);
      if (v.destino === central.id) vizinhos.add(v.origem);
    }
    return {
      nodes: scenario.nos.filter((n) => vizinhos.has(n.id)),
      edges: edgesByTipo.filter((v) => vizinhos.has(v.origem) && vizinhos.has(v.destino)),
    };
  }, [scenario, tiposVinculo, profundidade]);

  const metricas = useMemo(() => {
    if (!scenario) return [];
    const empresas = scenario.nos.filter((n) => n.tipo === "empresa").length;
    const ligacoesAutuados = scenario.nos.reduce((acc, n) => acc + n.ligacoesAutuados, 0);
    return [
      { label: "Entidades na rede", valor: String(scenario.nos.length), sub: "nós resolvidos" },
      { label: "Pessoas jurídicas", valor: String(empresas), sub: "contribuintes e PJ externas" },
      {
        label: "Vínculos mapeados",
        valor: String(scenario.vinculos.length),
        sub: "societários, endereço e financeiros",
      },
      {
        label: "Ligações com autuados",
        valor: String(ligacoesAutuados),
        sub: "conexões diretas na comunidade",
      },
      {
        label: "Valor estimado",
        valor: BRL.format(scenario.valorEstimado),
        sub: "receita envolvida no esquema",
      },
      { label: "Score de rede", valor: String(scenario.scoreRede), sub: "risco da comunidade" },
    ];
  }, [scenario]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Análise de Redes"
        description="Graph analytics com resolução de entidades: contribuintes, sócios, endereços e fornecedores conectados para revelar vínculos invisíveis caso a caso. Módulo 3."
        action={
          scenario ? (
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand-050 px-3.5 py-2 text-xs font-bold text-brand">
              Comunidade suspeita <span className="font-data">{scenario.codigo}</span> · score de
              rede {scenario.scoreRede}
            </span>
          ) : undefined
        }
      />

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={scenarios.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3">
            <SkeletonCard height="h-20" />
            <SkeletonCard height="h-96" />
          </div>
        }
        empty={
          <EmptyState
            icon={Share2Icon}
            title="Nenhuma comunidade suspeita detectada"
            description="O Agente de Redes ainda não identificou comunidades com padrões de conluio ou fragmentação."
          />
        }
      >
        {scenario ? (
          <>
            {/* Barra de contexto/filtros */}
            <section
              aria-label="Filtros do grafo"
              className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <div className="grid gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  Comunidade
                </span>
                <Select
                  value={scenario.id}
                  onValueChange={(v) => {
                    setScenarioId(v);
                    setSelectedNode(null);
                  }}
                >
                  <SelectTrigger size="sm" className="w-72" aria-label="Selecionar comunidade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visiveis.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.codigo} · {ESQUEMA_LABEL[s.esquema]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  Período analisado
                </span>
                <Select
                  value={periodo}
                  onValueChange={(v) => {
                    setPeriodo(v);
                    setScenarioId(null);
                  }}
                >
                  <SelectTrigger size="sm" className="w-40" aria-label="Filtrar por período">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {periodos.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  Tipos de vínculo exibidos
                </span>
                <div className="flex gap-1.5">
                  {EDGE_TIPOS.map((tipo) => {
                    const ativo = tiposVinculo.includes(tipo);
                    return (
                      <button
                        key={tipo}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() =>
                          setTiposVinculo((prev) =>
                            ativo ? prev.filter((t) => t !== tipo) : [...prev, tipo],
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-semibold transition-colors",
                          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          ativo
                            ? "border-brand-100 bg-brand-050 text-brand"
                            : "border-border bg-surface text-muted-foreground hover:bg-n-25",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="h-[3px] w-3.5 rounded-sm"
                          style={{
                            backgroundColor: ativo ? EDGE_COLOR[tipo] : "var(--n-300)",
                            ...(EDGE_DASH[tipo]
                              ? { backgroundImage: "none", opacity: 0.9 }
                              : undefined),
                          }}
                        />
                        {EDGE_TIPO_LABEL[tipo]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ml-auto grid gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  Profundidade
                </span>
                <Select value={profundidade} onValueChange={(v) => setProfundidade(v as "1" | "2")}>
                  <SelectTrigger size="sm" className="w-32" aria-label="Profundidade do grafo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 nível</SelectItem>
                    <SelectItem value="2">2 níveis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Métricas da comunidade */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {metricas.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
                >
                  <p className="min-h-8 text-xs font-bold uppercase leading-tight tracking-[0.03em] text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="mt-1 font-data text-lg font-semibold text-text-strong">{m.valor}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
              {/* Canvas do grafo + legenda */}
              <div className="rounded-lg border border-border bg-surface p-2 shadow-[var(--e-1)]">
                <NetworkGraph
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id}
                  onSelectNode={setSelectedNode}
                />
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-3 pb-1.5 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    Entidades
                  </span>
                  {(Object.keys(NODE_TIPO_LABEL) as (keyof typeof NODE_TIPO_LABEL)[]).map(
                    (tipo) => (
                      <span
                        key={tipo}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: NODE_COLOR[tipo] }}
                        />
                        {NODE_TIPO_LABEL[tipo]}
                      </span>
                    ),
                  )}
                  <span aria-hidden="true" className="h-4 w-px bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    Vínculos
                  </span>
                  {EDGE_TIPOS.map((tipo) => (
                    <span
                      key={tipo}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      <span
                        aria-hidden="true"
                        className="h-[3px] w-4 rounded-sm"
                        style={{ backgroundColor: EDGE_COLOR[tipo] }}
                      />
                      {EDGE_TIPO_LABEL[tipo]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Painel lateral: padrões + recomendação do agente */}
              <div className="flex flex-col gap-4">
                <section
                  className="rounded-lg border border-border bg-surface p-5 shadow-[var(--e-1)]"
                  aria-label="Padrões detectados"
                >
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-strong">
                    <span className="flex size-7 items-center justify-center rounded-[var(--r-sm)] bg-[image:var(--grad-aurora)]">
                      <Share2Icon aria-hidden="true" className="size-3.5 text-white" />
                    </span>
                    Padrões detectados
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {scenario.padroes.map((padrao) => (
                      <div
                        key={padrao.titulo}
                        className="rounded-[var(--r-md)] border border-border p-3"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: `var(--c-risk-${padrao.severidade})`,
                        }}
                      >
                        <p className="text-xs font-bold text-text-strong">{padrao.titulo}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {padrao.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="rounded-lg bg-[linear-gradient(160deg,var(--c-brand-darkest),var(--c-brand-deep))] p-5 text-white"
                  aria-label="Recomendação do agente"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--c-aurora-to)]">
                    <SparklesIcon aria-hidden="true" className="size-3.5" /> Recomendação do agente
                  </p>
                  <p className="text-[13px] leading-relaxed text-white/90">
                    {scenario.recomendacao.resumo}
                  </p>
                  <p className="mt-2 text-[13px] font-semibold leading-relaxed text-white">
                    {scenario.recomendacao.acaoSugerida}
                  </p>
                  {scenario.casoRelacionadoId ? (
                    <Button asChild variant="secondary" className="mt-4 w-full rounded-pill">
                      <Link href={`/cases?caso=${scenario.casoRelacionadoId}`}>
                        Abrir dossiê consolidado
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" className="mt-4 w-full rounded-pill">
                      <Link href="/cases">Abrir fila de casos</Link>
                    </Button>
                  )}
                </section>
              </div>
            </div>

            {/* Biblioteca de cenários — clicar troca o grafo */}
            <section aria-label="Cenários de rede detectados" className="grid gap-3">
              <h2 className="text-sm font-bold text-text-strong">
                Comunidades detectadas pelo Agente de Redes
                <span className="ml-2 font-normal text-muted-foreground">
                  {visiveis.length} cenário{visiveis.length === 1 ? "" : "s"} no período
                </span>
              </h2>
              <ol className="grid gap-2.5">
                {visiveis.map((s) => {
                  const ativo = s.id === scenario.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => {
                          setScenarioId(s.id);
                          setSelectedNode(null);
                          if (typeof window !== "undefined") {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={cn(
                          "w-full rounded-lg border p-4 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          ativo
                            ? "border-brand bg-brand-050/60 shadow-[var(--e-1)]"
                            : "border-border bg-surface hover:border-brand-100 hover:bg-n-25",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-data text-xs font-bold text-brand">
                              {s.codigo}
                            </span>
                            <span className="text-sm font-semibold text-text-strong">
                              {s.titulo}
                            </span>
                            <Badge variant="outline">{ESQUEMA_LABEL[s.esquema]}</Badge>
                          </div>
                          <div className="flex items-center gap-3 font-data text-xs text-muted-foreground">
                            <span>{s.periodo}</span>
                            <span className="font-semibold text-[color:var(--c-risk-4-txt)]">
                              {BRL.format(s.valorEstimado)}
                            </span>
                            <span className="rounded-pill bg-n-50 px-2 py-0.5 font-bold text-text-strong">
                              score {s.scoreRede}
                            </span>
                            <ArrowRightIcon aria-hidden="true" className="size-4" />
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {s.resumo}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>

            <NodeDrawer
              node={selectedNode}
              scenario={scenario}
              open={selectedNode !== null}
              onOpenChange={(open) => (!open ? setSelectedNode(null) : undefined)}
            />
          </>
        ) : null}
      </AsyncBoundary>
    </div>
  );
}
