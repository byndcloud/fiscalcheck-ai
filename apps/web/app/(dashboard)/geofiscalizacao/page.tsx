"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Caso, Contribuinte, GeoObra, GeoObraTipo } from "@fiscalcheck/shared-types";

import { OBRA_TIPO_LABEL } from "@/components/geo/geo-labels";
import { GeoMap } from "@/components/geo/geo-map";
import { ObraComparePanel } from "@/components/geo/obra-compare-panel";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Geofiscalização (T21 · módulo 7 · complementar).

  Mapa estilizado com pins de obras/imóveis com indício de divergência
  em construção civil (detecção por visão computacional), popup com
  dados do contribuinte, painel comparando detectado × NFS-e/alvarás e
  ação "gerar caso" que abre caso candidato na fila do módulo 4 (T13)
  com badge AGENTE — sempre com confirmação do auditor.
*/

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const OBRA_TIPOS = Object.keys(OBRA_TIPO_LABEL) as GeoObraTipo[];

type OpenCaseResponse = { obra: GeoObra; caso: Caso };

export default function GeofiscalizacaoPage() {
  const queryClient = useQueryClient();
  const [bairro, setBairro] = useState("todos");
  const [tipos, setTipos] = useState<GeoObraTipo[]>([...OBRA_TIPOS]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<GeoObra | null>(null);

  const query = useQuery({
    queryKey: ["geo", "obras"],
    queryFn: () => apiRequest<GeoObra[]>("/support/geofiscalizacao/obras"),
    meta: { silent: true },
  });

  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });

  const openCase = useMutation({
    mutationFn: (obraId: string) =>
      apiRequest<OpenCaseResponse>(`/support/geofiscalizacao/obras/${obraId}/open-case`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      toast.success(
        `Caso candidato ${data.caso.id.toUpperCase()} aberto na fila — indício de obra anexado como evidência.`,
      );
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ["geo", "obras"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  const obras = useMemo(() => query.data ?? [], [query.data]);

  const taxpayerById = useMemo(() => {
    const map = new Map<string, Contribuinte>();
    for (const c of taxpayers.data ?? []) map.set(c.id, c);
    return map;
  }, [taxpayers.data]);

  const bairros = useMemo(() => [...new Set(obras.map((o) => o.bairro))].sort(), [obras]);

  const visiveis = useMemo(
    () =>
      obras.filter((o) => (bairro === "todos" || o.bairro === bairro) && tipos.includes(o.tipo)),
    [obras, bairro, tipos],
  );

  const selected = visiveis.find((o) => o.id === selectedId) ?? null;

  const metricas = useMemo(() => {
    const divergenciaTotal = visiveis.reduce(
      (acc, o) => acc + Math.max(0, o.valorEstimadoObra - o.nfseConstrucao12m),
      0,
    );
    const semAlvara = visiveis.filter((o) => o.alvara.situacao === "sem_alvara").length;
    const casosAbertos = visiveis.filter((o) => o.status === "caso_aberto").length;
    return [
      { label: "Obras com indício", valor: String(visiveis.length), sub: "no recorte atual" },
      {
        label: "Divergência estimada",
        valor: BRL.format(divergenciaTotal),
        sub: "serviços × NFS-e declaradas",
      },
      { label: "Sem alvará", valor: String(semAlvara), sub: "intervenções sem licenciamento" },
      {
        label: "Casos já abertos",
        valor: String(casosAbertos),
        sub: "candidatos na fila do módulo 4",
      },
    ];
  }, [visiveis]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Geofiscalização"
        description="Obras e imóveis com indício de divergência em construção civil, detectados por visão computacional (satélite e imagens de rua) e cruzados com NFS-e e alvarás. Módulo 7."
      />

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={obras.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3">
            <SkeletonCard height="h-16" />
            <SkeletonCard height="h-96" />
          </div>
        }
        empty={
          <EmptyState
            icon={MapPinIcon}
            title="Nenhuma obra com indício"
            description="O agente de geofiscalização ainda não detectou obras ou imóveis com divergência entre a intervenção observada e as NFS-e e alvarás do endereço."
          />
        }
      >
        {/* Filtros por bairro e tipo (aceite T21) */}
        <section
          aria-label="Filtros do mapa"
          className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
        >
          <div className="grid gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Bairro
            </span>
            <Select
              value={bairro}
              onValueChange={(v) => {
                setBairro(v);
                setSelectedId(null);
              }}
            >
              <SelectTrigger size="sm" className="w-52" aria-label="Filtrar por bairro">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os bairros</SelectItem>
                {bairros.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Tipo de intervenção
            </span>
            <div className="flex gap-1.5">
              {OBRA_TIPOS.map((tipo) => {
                const ativo = tipos.includes(tipo);
                return (
                  <button
                    key={tipo}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => {
                      setTipos((prev) =>
                        ativo ? prev.filter((t) => t !== tipo) : [...prev, tipo],
                      );
                      setSelectedId(null);
                    }}
                    className={cn(
                      "inline-flex items-center rounded-pill border px-2.5 py-1 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      ativo
                        ? "border-brand-100 bg-brand-050 text-brand"
                        : "border-border bg-surface text-muted-foreground hover:bg-n-25",
                    )}
                  >
                    {OBRA_TIPO_LABEL[tipo]}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="ml-auto text-xs text-muted-foreground">
            <span className="font-data font-bold text-text-strong">{visiveis.length}</span> de{" "}
            <span className="font-data">{obras.length}</span> obras no mapa
          </p>
        </section>

        {/* Métricas do recorte */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricas.map((m) => (
            <div
              key={m.label}
              className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <p className="text-xs font-bold uppercase leading-tight tracking-[0.03em] text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 break-words font-data text-lg font-semibold leading-snug text-text-strong">
                {m.valor}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-border bg-surface p-2 shadow-[var(--e-1)]">
            {visiveis.length === 0 ? (
              <EmptyState
                icon={MapPinIcon}
                title="Nenhuma obra no recorte"
                description="Ajuste os filtros de bairro ou tipo de intervenção para ver os pins no mapa."
              />
            ) : (
              <GeoMap
                obras={visiveis}
                taxpayerById={taxpayerById}
                selectedId={selected?.id ?? null}
                onSelect={(obra) => setSelectedId(obra?.id ?? null)}
                onOpenCase={setConfirming}
              />
            )}
          </div>

          <ObraComparePanel obra={selected} />
        </div>
      </AsyncBoundary>

      {/* Confirmação do auditor — nenhum caso é gerado sem decisão humana */}
      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => (!open ? setConfirming(null) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar caso na fila</DialogTitle>
            <DialogDescription>
              Abre um caso candidato para a obra em{" "}
              <strong>
                {confirming?.endereco} ({confirming?.bairro})
              </strong>{" "}
              com a detecção por visão computacional anexada como indício. Qualquer efeito sobre o
              contribuinte só ocorre após a instrução e aprovação no fluxo de casos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={openCase.isPending}
              onClick={() => confirming && openCase.mutate(confirming.id)}
            >
              {openCase.isPending ? "Abrindo caso…" : "Confirmar e gerar caso candidato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
