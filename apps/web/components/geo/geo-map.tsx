"use client";

import { ArrowRightIcon, XIcon } from "lucide-react";
import Link from "next/link";

import type { Contribuinte, GeoObra } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { ALVARA_SITUACAO_LABEL, OBRA_TIPO_LABEL } from "@/components/geo/geo-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/*
  Mapa da Geofiscalização (T21) — SVG puro, sem lib externa, seguindo o
  precedente do grafo T12 (ADR rejeitou dependência nova para o POC).
  O fundo é um mapa ESTILIZADO de Brusque (rio + vias + bairros), não um
  tile real: as coordenadas dos pins são normalizadas (0–100) e nunca
  correspondem a lat/long de imóvel identificável (AGENTS.md §1.2).
  A troca por Leaflet/OSM na fase real muda só este componente — o
  contrato GeoObra permanece.

  viewBox 160×100 casa com o aspect-[8/5] do container: o popup em
  porcentagem fica ancorado exatamente sobre o pin.
*/

const VIEW_W = 160;
const VIEW_H = 100;

/** Rótulos decorativos de bairro (posições do mapa estilizado, 0–100). */
const BAIRRO_LABELS: readonly { nome: string; x: number; y: number }[] = [
  { nome: "Primeiro de Maio", x: 12, y: 25 },
  { nome: "Dom Joaquim", x: 40, y: 13 },
  { nome: "Águas Claras", x: 69, y: 20 },
  { nome: "Santa Terezinha", x: 29, y: 32 },
  { nome: "Limeira", x: 87, y: 39 },
  { nome: "Centro", x: 51, y: 62 },
  { nome: "Azambuja", x: 19, y: 76 },
  { nome: "São Pedro", x: 63, y: 83 },
  { nome: "Guarani", x: 80, y: 70 },
];

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type Props = {
  obras: GeoObra[];
  taxpayerById: Map<string, Contribuinte>;
  selectedId: string | null;
  onSelect: (obra: GeoObra | null) => void;
  onOpenCase: (obra: GeoObra) => void;
};

export function GeoMap({ obras, taxpayerById, selectedId, onSelect, onOpenCase }: Props) {
  const selected = obras.find((o) => o.id === selectedId) ?? null;
  const taxpayer = selected ? taxpayerById.get(selected.contribuinteId) : undefined;

  return (
    <div className="relative w-full">
      <div className="relative aspect-[8/5] w-full overflow-hidden rounded-[var(--r-md)] bg-[radial-gradient(1200px_500px_at_50%_20%,var(--n-25),var(--surface))]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label="Mapa estilizado de Brusque com pins de obras e imóveis com indício de divergência em construção civil"
          className="block h-full w-full"
        >
          {/* Rio Itajaí-Mirim (estilizado) */}
          <path
            d="M 0 62 C 28 55, 48 68, 78 60 C 108 52, 128 64, 160 55"
            fill="none"
            stroke="var(--c-brand-100)"
            strokeWidth={3.2}
            opacity={0.55}
            strokeLinecap="round"
          />
          {/* Vias principais (decorativas) */}
          <g stroke="var(--n-100)" strokeWidth={0.9} opacity={0.8}>
            <path d="M 20 0 C 35 30, 45 55, 40 100" fill="none" />
            <path d="M 0 40 C 45 42, 95 30, 160 42" fill="none" />
            <path d="M 100 0 C 92 35, 100 70, 118 100" fill="none" />
            <path d="M 0 82 C 50 74, 110 84, 160 74" fill="none" />
          </g>

          {/* Decorativo: o <svg role=img> pai já expõe o rótulo acessível */}
          {BAIRRO_LABELS.map((b) => (
            <text
              key={b.nome}
              x={(b.x / 100) * VIEW_W}
              y={b.y}
              textAnchor="middle"
              className="fill-[var(--t-muted)] uppercase"
              style={{ fontSize: 2.6, letterSpacing: 0.5, fontWeight: 700, opacity: 0.75 }}
            >
              {b.nome}
            </text>
          ))}

          {obras.map((obra) => {
            const cx = (obra.x / 100) * VIEW_W;
            const cy = obra.y;
            const r = 2 + obra.severidade * 0.35;
            const isSelected = obra.id === selectedId;
            return (
              <g
                key={obra.id}
                // biome-ignore lint/a11y/useSemanticElements: não existe <button> dentro de SVG — <g role=button> é o padrão acessível para pins de mapa (mesmo padrão do grafo T12)
                role="button"
                tabIndex={0}
                aria-label={`${OBRA_TIPO_LABEL[obra.tipo]} em ${obra.endereco}, bairro ${obra.bairro} — severidade ${obra.severidade} de 5. Abrir dados do contribuinte.`}
                data-testid={`geo-pin-${obra.id}`}
                className="group cursor-pointer outline-none"
                onClick={() => onSelect(isSelected ? null : obra)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(isSelected ? null : obra);
                  }
                  if (e.key === "Escape") onSelect(null);
                }}
              >
                {/* Anel de foco visível (WCAG) — só aparece via teclado */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 1.6}
                  fill="none"
                  stroke="var(--c-brand-300)"
                  strokeWidth={0.9}
                  className="opacity-0 group-focus-visible:opacity-100"
                />
                {isSelected ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 1.4}
                    fill="none"
                    stroke="var(--c-aurora-to)"
                    strokeWidth={0.7}
                  />
                ) : null}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={`var(--c-risk-${obra.severidade})`}
                  opacity={0.92}
                  stroke="var(--surface)"
                  strokeWidth={0.6}
                />
                {/* Miolo branco = caso candidato já aberto na fila */}
                {obra.status === "caso_aberto" ? (
                  <circle cx={cx} cy={cy} r={r * 0.4} fill="var(--surface)" />
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Popup do pin — dados do contribuinte + ação (aceite T21) */}
        {selected ? (
          // Popup não-modal ancorado ao pin — <section> rotulada, não um dialog
          <section
            aria-label={`Dados do contribuinte da obra em ${selected.endereco}`}
            data-testid="geo-popup"
            className="absolute z-10 w-72 max-w-[86%] rounded-lg border border-border bg-surface p-3.5 shadow-[var(--e-3)]"
            style={{
              left: `${Math.min(Math.max(selected.x, 18), 82)}%`,
              top: `${selected.y}%`,
              transform:
                selected.y < 34 ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 12px))",
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onSelect(null);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-strong">
                  <span data-sensitive>{taxpayer?.razaoSocial ?? selected.contribuinteId}</span>
                </p>
                <p className="font-data text-[11px] text-muted-foreground">
                  <span data-sensitive>{taxpayer?.cnpjMascarado ?? "CNPJ não localizado"}</span>
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar dados do contribuinte"
                onClick={() => onSelect(null)}
                className="rounded-[var(--r-sm)] p-1 text-muted-foreground transition-colors hover:bg-n-25 hover:text-text-strong focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2"
              >
                <XIcon aria-hidden="true" className="size-3.5" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              {selected.endereco} · {selected.bairro}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{OBRA_TIPO_LABEL[selected.tipo]}</Badge>
              <Badge variant="outline">{ALVARA_SITUACAO_LABEL[selected.alvara.situacao]}</Badge>
              <AgentRecommendationBadge />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Divergência estimada{" "}
              <span className="font-data font-bold text-[color:var(--c-risk-4-txt)]">
                {BRL.format(Math.max(0, selected.valorEstimadoObra - selected.nfseConstrucao12m))}
              </span>
            </p>

            <div className="mt-3">
              {selected.status === "caso_aberto" && selected.casoId ? (
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/cases?caso=${selected.casoId}`}>
                    Ver caso {selected.casoId.toUpperCase()}
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={() => onOpenCase(selected)}
                >
                  Gerar caso na fila
                </Button>
              )}
            </div>
          </section>
        ) : null}
      </div>

      {/* Legenda */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-3 pb-1.5 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Severidade do indício
        </span>
        {([1, 2, 3, 4, 5] as const).map((s) => (
          <span
            key={s}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: `var(--c-risk-${s})` }}
            />
            {s}
          </span>
        ))}
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span
            aria-hidden="true"
            className="flex size-2.5 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--c-risk-3)" }}
          >
            <span className="size-1 rounded-full bg-surface" />
          </span>
          Caso já aberto na fila
        </span>
      </div>
    </div>
  );
}
