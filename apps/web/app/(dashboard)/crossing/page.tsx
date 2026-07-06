"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ScanSearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { Caso, Contribuinte, Divergencia, Score } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { DivergenciaDetailSheet } from "@/components/crossing/divergencia-detail-sheet";
import {
  FAIXAS_VALOR,
  type FaixaValorId,
  ORIGEM_LABEL,
  TIPO_LABEL,
  formatCompetencia,
  setorFromAtividade,
} from "@/components/crossing/divergencia-labels";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";
import { filterDivergencias } from "@/lib/crossing/filter-divergencias";
import { cn } from "@/lib/utils";

/*
  Cruzamento e Inconsistências (T05 · módulo 2 · RF02/FA02).

  Lista de divergências declarado × NFS-e com filtros COMBINÁVEIS
  (tipo em chips + período + faixa de valor + setor), badge AGENTE na
  origem, diferença (R$) em destaque e detalhe lado a lado com
  evidências — caso instruído e auditável, não alerta estatístico.
*/

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type NivelRiscoUI = "conforme" | "baixo" | "medio" | "alto" | "critico";

function severidadeToLevel(severidade: number): NivelRiscoUI {
  const clamped = Math.max(1, Math.min(5, Math.round(severidade)));
  return (["conforme", "baixo", "medio", "alto", "critico"] as const)[clamped - 1] as NivelRiscoUI;
}

const TIPOS_FILTRO = Object.keys(TIPO_LABEL) as Divergencia["tipo"][];

export default function CrossingPage() {
  const [tiposAtivos, setTiposAtivos] = useState<Divergencia["tipo"][]>([]);
  const [periodo, setPeriodo] = useState("todas");
  const [faixaValor, setFaixaValor] = useState<FaixaValorId>("todas");
  const [setor, setSetor] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["crossing", "divergences"],
    queryFn: () => apiRequest<Divergencia[]>("/crossing/divergences"),
    meta: { silent: true },
  });

  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });

  const casos = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiRequest<Caso[]>("/cases"),
    staleTime: 60 * 1000,
    meta: { silent: true },
  });

  const scores = useQuery({
    queryKey: ["ai", "scores"],
    queryFn: () => apiRequest<Score[]>("/ai/scores"),
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });

  const taxpayerById = useMemo(() => {
    const map = new Map<string, Contribuinte>();
    for (const c of taxpayers.data ?? []) map.set(c.id, c);
    return map;
  }, [taxpayers.data]);

  const casoByDivergencia = useMemo(() => {
    const map = new Map<string, Caso>();
    for (const caso of casos.data ?? []) {
      for (const dvId of caso.divergenciaIds) map.set(dvId, caso);
    }
    return map;
  }, [casos.data]);

  const scoreByContribuinte = useMemo(
    () => new Map((scores.data ?? []).map((s) => [s.contribuinteId, s])),
    [scores.data],
  );

  const divergencias = useMemo(() => query.data ?? [], [query.data]);

  const periodos = useMemo(() => {
    const set = new Set<string>();
    for (const dv of divergencias) if (dv.competencia) set.add(dv.competencia);
    return [...set].sort().reverse();
  }, [divergencias]);

  const setores = useMemo(() => {
    const set = new Set<string>();
    for (const dv of divergencias) {
      set.add(setorFromAtividade(taxpayerById.get(dv.contribuinteId)?.atividadePrincipal));
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [divergencias, taxpayerById]);

  // Filtros combinam entre si (E entre dimensões, OU dentro dos chips de tipo).
  const filtradas = useMemo(
    () =>
      filterDivergencias(divergencias, { tipos: tiposAtivos, periodo, faixaValor, setor }, (dv) =>
        setorFromAtividade(taxpayerById.get(dv.contribuinteId)?.atividadePrincipal),
      ),
    [divergencias, tiposAtivos, periodo, faixaValor, setor, taxpayerById],
  );

  const filtrosAtivos =
    tiposAtivos.length > 0 || periodo !== "todas" || faixaValor !== "todas" || setor !== "todos";

  const selecionada = divergencias.find((dv) => dv.id === selectedId) ?? null;

  const columns = useMemo<ColumnDef<Divergencia>[]>(
    () => [
      {
        accessorKey: "contribuinteId",
        header: "Contribuinte",
        cell: ({ row }) => {
          const taxpayer = taxpayerById.get(row.original.contribuinteId);
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-strong">
                {taxpayer?.razaoSocial ?? row.original.contribuinteId}
              </p>
              <p className="font-data text-[11px] text-muted-foreground">
                {taxpayer?.cnpjMascarado ?? "—"}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ getValue }) => (
          <Badge variant="outline">{TIPO_LABEL[getValue<Divergencia["tipo"]>()]}</Badge>
        ),
      },
      {
        accessorKey: "origem",
        header: "Origem",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <AgentRecommendationBadge />
            {ORIGEM_LABEL[getValue<Divergencia["origem"]>()]}
          </span>
        ),
      },
      {
        accessorKey: "competencia",
        header: "Período",
        cell: ({ getValue }) => (
          <span className="font-data text-xs">{formatCompetencia(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "valor",
        header: "Diferença (R$)",
        cell: ({ getValue }) => {
          const v = getValue<number | null | undefined>();
          return v == null ? (
            <span className="text-xs text-muted-foreground">não monetária</span>
          ) : (
            <span className="font-data text-sm font-bold text-[color:var(--c-risk-4-txt)]">
              {BRL.format(v)}
            </span>
          );
        },
      },
      {
        accessorKey: "severidade",
        header: "Risco",
        cell: ({ getValue }) => (
          <StatusBadge kind="risk" level={severidadeToLevel(getValue<number>())} />
        ),
      },
      {
        id: "acoes",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedId(row.original.id)}
          >
            Ver detalhe
          </Button>
        ),
      },
    ],
    [taxpayerById],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Detecção e cruzamento"
        description="Divergências entre valores declarados e NFS-e emitidas, com evidências e cálculo auditável da diferença. Módulo 2."
      />

      {/* Filtros combináveis (RF02) */}
      <section
        aria-label="Filtros de divergências"
        className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {TIPOS_FILTRO.map((tipo) => {
            const ativo = tiposAtivos.includes(tipo);
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={ativo}
                onClick={() =>
                  setTiposAtivos((prev) =>
                    ativo ? prev.filter((t) => t !== tipo) : [...prev, tipo],
                  )
                }
                className={cn(
                  "rounded-pill border px-3 py-1 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  ativo
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-surface text-foreground hover:border-brand-100 hover:bg-brand-050",
                )}
              >
                {TIPO_LABEL[tipo]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger size="sm" className="w-44" aria-label="Filtrar por período">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os períodos</SelectItem>
              {periodos.map((p) => (
                <SelectItem key={p} value={p}>
                  {formatCompetencia(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={faixaValor} onValueChange={(v) => setFaixaValor(v as FaixaValorId)}>
            <SelectTrigger size="sm" className="w-52" aria-label="Filtrar por faixa de valor">
              <SelectValue placeholder="Faixa de valor" />
            </SelectTrigger>
            <SelectContent>
              {FAIXAS_VALOR.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={setor} onValueChange={setSetor}>
            <SelectTrigger size="sm" className="w-56" aria-label="Filtrar por setor">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os setores</SelectItem>
              {setores.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="ml-auto text-xs text-muted-foreground">
            {filtradas.length} de {divergencias.length} divergências
          </p>

          {filtrosAtivos ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTiposAtivos([]);
                setPeriodo("todas");
                setFaixaValor("todas");
                setSetor("todos");
              }}
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </section>

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={divergencias.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={<SkeletonTable rows={6} columns={6} />}
        empty={
          <EmptyState
            icon={ScanSearchIcon}
            title="Nenhuma divergência aberta"
            description="O motor de cruzamento não encontrou inconsistências entre o declarado e as NFS-e do período."
          />
        }
      >
        {filtradas.length === 0 ? (
          <EmptyState
            icon={ScanSearchIcon}
            title="Nenhuma divergência corresponde aos filtros"
            description="Ajuste ou limpe os filtros para ver todas as divergências detectadas."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtradas}
            searchable
            searchPlaceholder="Buscar por contribuinte, tipo…"
            emptyMessage="Nenhuma divergência aberta."
          />
        )}
      </AsyncBoundary>

      <DivergenciaDetailSheet
        divergencia={selecionada}
        contribuinte={selecionada ? taxpayerById.get(selecionada.contribuinteId) : undefined}
        caso={selecionada ? casoByDivergencia.get(selecionada.id) : undefined}
        score={selecionada ? scoreByContribuinte.get(selecionada.contribuinteId) : undefined}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
