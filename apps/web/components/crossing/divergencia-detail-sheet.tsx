"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, EqualIcon, FileTextIcon, MinusIcon } from "lucide-react";
import Link from "next/link";

import type { Caso, Contribuinte, Divergencia, NFSe, Score } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import {
  ORIGEM_LABEL,
  TIPO_LABEL,
  formatCompetencia,
} from "@/components/crossing/divergencia-labels";
import { ScoreFactorsPanel } from "@/components/risk/score-factors-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SkeletonText } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/*
  Detalhe da divergência (T05 · módulo 2 · RF02/FA02).

  Caso instruído e auditável, não alerta estatístico:
  - lado a lado "declarado × documentado em NFS-e" com o CÁLCULO da
    diferença explícito (apurado − declarado = diferença);
  - evidências primárias (NFS-e de origem) nominais, preservando a
    cadeia de custódia;
  - painel "Por que este score?" (T09) quando o contribuinte tem score;
  - link para o Dossiê (T13) quando a divergência já instrui um caso.
*/

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type NivelRiscoUI = "conforme" | "baixo" | "medio" | "alto" | "critico";

function severidadeToLevel(severidade: number): NivelRiscoUI {
  const clamped = Math.max(1, Math.min(5, Math.round(severidade)));
  return (["conforme", "baixo", "medio", "alto", "critico"] as const)[clamped - 1] as NivelRiscoUI;
}

type Props = {
  divergencia: Divergencia | null;
  contribuinte: Contribuinte | undefined;
  caso: Caso | undefined;
  score: Score | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DivergenciaDetailSheet({
  divergencia,
  contribuinte,
  caso,
  score,
  open,
  onOpenChange,
}: Props) {
  const nfse = useQuery({
    queryKey: ["nfse"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
    queryFn: () => apiRequest<NFSe[]>("/nfse"),
    meta: { silent: true },
  });

  if (!divergencia) return null;

  const evidenciasNfse = (nfse.data ?? []).filter((n) => divergencia.evidencias.includes(n.id));
  const temParValores =
    divergencia.valorDeclarado !== undefined && divergencia.valorApurado !== undefined;

  // RF 3.1.1: quando a origem é DIMP, o lado "documentado" é a
  // movimentação em cartões, não a soma de NFS-e.
  const isDimp = divergencia.origem === "dimp_vs_declarado";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="pr-8">
            Divergência {divergencia.id.toUpperCase()} · {TIPO_LABEL[divergencia.tipo]}
          </SheetTitle>
          <SheetDescription>
            {contribuinte
              ? `${contribuinte.razaoSocial} · CNPJ ${contribuinte.cnpjMascarado}`
              : divergencia.contribuinteId}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-5 px-4 pb-6">
          {/* Identificação e origem */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{TIPO_LABEL[divergencia.tipo]}</Badge>
            <StatusBadge kind="risk" level={severidadeToLevel(divergencia.severidade)} />
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <AgentRecommendationBadge />
              {ORIGEM_LABEL[divergencia.origem]}
            </span>
            {divergencia.competencia ? (
              <span className="font-data text-xs text-muted-foreground">
                Competência {formatCompetencia(divergencia.competencia)}
              </span>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-foreground">{divergencia.descricao}</p>

          {/* Lado a lado: declarado × documentado + cálculo da diferença */}
          {temParValores ? (
            <section aria-label="Declarado versus documentado" className="grid gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isDimp
                  ? "Declarado × movimentação em cartões (DIMP)"
                  : "Declarado × documentado em NFS-e"}
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-[var(--r-md)] border border-border bg-surface p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Valor declarado
                  </p>
                  <p className="mt-1 font-data text-lg font-semibold text-text-strong">
                    {BRL.format(divergencia.valorDeclarado ?? 0)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Apuração entregue pelo contribuinte
                  </p>
                </article>
                <article className="rounded-[var(--r-md)] border border-brand-100 bg-brand-050 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-brand-deep">
                    {isDimp ? "Movimentado em cartões (DIMP)" : "Documentado em NFS-e"}
                  </p>
                  <p className="mt-1 font-data text-lg font-semibold text-text-strong">
                    {BRL.format(divergencia.valorApurado ?? 0)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-brand-deep/80">
                    {isDimp
                      ? "Transações de meios de pagamento informadas pelas credenciadoras"
                      : "Soma das notas de origem (evidências)"}
                  </p>
                </article>
              </div>

              {/* Cálculo explícito — peça auditável, não alerta */}
              <div
                className={cn(
                  "flex flex-wrap items-center justify-center gap-2 rounded-[var(--r-md)] border p-3",
                  "border-[color-mix(in_srgb,var(--c-risk-4)_40%,transparent)] bg-[color-mix(in_srgb,var(--c-risk-4)_8%,var(--surface))]",
                )}
              >
                <span className="font-data text-sm text-text-strong">
                  {BRL.format(divergencia.valorApurado ?? 0)}
                </span>
                <MinusIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                <span className="font-data text-sm text-text-strong">
                  {BRL.format(divergencia.valorDeclarado ?? 0)}
                </span>
                <EqualIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                <span className="font-data text-base font-bold text-[color:var(--c-risk-4-txt)]">
                  {BRL.format(divergencia.valor ?? 0)}
                </span>
                <span className="w-full text-center text-[11px] text-muted-foreground">
                  {isDimp
                    ? "Diferença apurada pelo cruzamento declarado × DIMP"
                    : "Diferença apurada pelo cruzamento declarado × NFS-e"}
                </span>
              </div>
            </section>
          ) : null}

          {/* Evidências primárias */}
          <section aria-label="Evidências de origem" className="grid gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidências ({divergencia.evidencias.length})
            </h4>
            {nfse.isPending ? (
              <SkeletonText lines={3} />
            ) : evidenciasNfse.length > 0 ? (
              <ul className="grid gap-2">
                {evidenciasNfse.map((nota) => (
                  <li
                    key={nota.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[var(--r-md)] border border-border bg-n-25 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileTextIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <div className="min-w-0">
                        <p className="font-data text-xs font-semibold text-text-strong">
                          NFS-e {nota.numero}
                          <span className="ml-2 font-normal text-muted-foreground">
                            {new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}
                          </span>
                        </p>
                        {nota.descricaoServico ? (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {nota.descricaoServico}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-data text-sm font-semibold text-text-strong">
                        {BRL.format(nota.valorServicos)}
                      </p>
                      <p className="font-data text-[11px] text-muted-foreground">
                        ISS {BRL.format(nota.iss)} ({nota.aliquota}%)
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[var(--r-md)] border border-border bg-n-25 p-3 text-xs text-muted-foreground">
                {isDimp ? "Extrato consolidado da carga DIMP" : "Evidências não fiscais"} (
                <span className="font-data">{divergencia.evidencias.join(", ")}</span>
                ). O detalhe completo fica registrado na cadeia de custódia do caso.
              </p>
            )}
          </section>

          {/* T09 — explicabilidade quando o contribuinte tem score */}
          {score ? <ScoreFactorsPanel score={score} /> : null}

          {/* Ponte para o Dossiê (T13) */}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <p className="text-[11px] text-muted-foreground">
              Detectada em {new Date(divergencia.detectadoEm).toLocaleString("pt-BR")}
            </p>
            {caso ? (
              <Button asChild size="sm">
                <Link href={`/cases?caso=${caso.id}`}>
                  Abrir dossiê do caso {caso.id.toUpperCase()}
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Ainda não instruída em caso — aguardando triagem do orquestrador.
              </p>
            )}
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
