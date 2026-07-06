"use client";

import { ArrowRightIcon, FingerprintIcon, GaugeIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import type { NetworkNode, NetworkScenario } from "@fiscalcheck/shared-types";

import { NODE_COLOR, NODE_TIPO_LABEL } from "@/components/network/network-labels";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/*
  Drawer do nó (T12): resolução de entidades (identidades unificadas),
  indicadores de risco de rede (centralidade, ligações com autuados) e
  ações "Abrir dossiê" / "Adicionar ao caso".
  "Adicionar ao caso" é mock com toast — a consolidação real acontece
  no módulo 4 sob aprovação do auditor.
*/

type Props = {
  node: NetworkNode | null;
  scenario: NetworkScenario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NodeDrawer({ node, scenario, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {node ? (
          <div className="flex flex-col gap-4 p-6">
            <SheetHeader className="gap-1 p-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full"
                  style={{ backgroundColor: NODE_COLOR[node.tipo] }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {NODE_TIPO_LABEL[node.tipo]} · comunidade {scenario.codigo}
                </span>
              </div>
              <SheetTitle>{node.label}</SheetTitle>
              {node.documento ? (
                <SheetDescription className="font-data">{node.documento}</SheetDescription>
              ) : null}
            </SheetHeader>

            {/* Scoring de risco de rede do nó */}
            <section
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              aria-label="Indicadores de risco de rede"
            >
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <GaugeIcon aria-hidden className="size-3.5" /> Risco de rede
              </h4>
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Score de rede
                  </dt>
                  <dd className="font-data text-xl font-semibold text-text-strong">
                    {node.scoreRede}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Centralidade
                  </dt>
                  <dd className="font-data text-xl font-semibold text-text-strong">
                    {node.centralidade.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Ligações c/ autuados
                  </dt>
                  <dd
                    className={`font-data text-xl font-semibold ${
                      node.ligacoesAutuados > 0
                        ? "text-[color:var(--c-risk-4-txt)]"
                        : "text-text-strong"
                    }`}
                  >
                    {node.ligacoesAutuados}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Resolução de entidades */}
            <section
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              aria-label="Resolução de entidades"
            >
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FingerprintIcon aria-hidden className="size-3.5" /> Identidades unificadas
              </h4>
              {node.identidades.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma identidade adicional resolvida para esta entidade.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {node.identidades.map((identidade) => (
                    <li
                      key={identidade}
                      className="rounded-[var(--r-sm)] border border-border bg-n-25 px-2.5 py-1.5 text-xs text-foreground"
                    >
                      {identidade}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex flex-col gap-2">
              {node.contribuinteId && scenario.casoRelacionadoId ? (
                <Button asChild>
                  <Link href={`/cases?caso=${scenario.casoRelacionadoId}`}>
                    Abrir dossiê
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : node.contribuinteId ? (
                <Button asChild>
                  <Link href="/cases">
                    Abrir fila de casos
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast.success(
                    `${node.label} adicionado como evidência ao caso da comunidade ${scenario.codigo} — sujeito à validação do auditor.`,
                  )
                }
              >
                Adicionar ao caso
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
