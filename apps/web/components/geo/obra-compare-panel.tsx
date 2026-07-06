"use client";

import { CameraIcon, FileCheck2Icon, MapPinIcon, SatelliteIcon } from "lucide-react";

import type { GeoObra } from "@fiscalcheck/shared-types";

import {
  ALVARA_SITUACAO_LABEL,
  FONTE_DETECCAO_LABEL,
  OBRA_TIPO_LABEL,
} from "@/components/geo/geo-labels";
import { Badge } from "@/components/ui/badge";

/*
  Painel comparativo da Geofiscalização (T21): o que a visão
  computacional DETECTOU (satélite/rua) × o que está DECLARADO
  (NFS-e de construção + alvará). A detecção é saída de agente —
  rotulada e nunca apresentada como fato consumado (AGENTS.md §1.1);
  quem decide gerar o caso é o auditor, no popup do pin.
*/

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const M2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

type Props = {
  obra: GeoObra | null;
};

export function ObraComparePanel({ obra }: Props) {
  if (!obra) {
    return (
      <section
        aria-label="Comparativo detectado × declarado"
        className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-6 text-center"
      >
        <MapPinIcon aria-hidden="true" className="size-6 text-muted-foreground" />
        <p className="text-sm font-semibold text-text-strong">Selecione um pin no mapa</p>
        <p className="max-w-56 text-xs leading-relaxed text-muted-foreground">
          O comparativo entre a detecção por satélite/rua e as NFS-e e alvarás do endereço aparece
          aqui.
        </p>
      </section>
    );
  }

  const divergencia = Math.max(0, obra.valorEstimadoObra - obra.nfseConstrucao12m);
  const areaLicenciada = obra.alvara.areaLicenciadaM2;
  const FonteIcon = obra.deteccao.fonte === "satelite" ? SatelliteIcon : CameraIcon;

  return (
    <section
      aria-label="Comparativo detectado × declarado"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-[var(--e-1)]"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-strong">Detectado × declarado</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {obra.endereco} · {obra.bairro}
          </p>
        </div>
        <Badge variant="outline">{OBRA_TIPO_LABEL[obra.tipo]}</Badge>
      </header>

      {/* Lado do agente — camada Aurora (saída de IA, DS §2.2) */}
      <div className="rounded-[var(--r-md)] border border-border p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-aurora">
          <span className="flex size-6 items-center justify-center rounded-[var(--r-sm)] bg-[image:var(--grad-aurora)]">
            <FonteIcon aria-hidden="true" className="size-3.5 text-white" />
          </span>
          Detectado por visão computacional
        </p>
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Fonte</dt>
            <dd className="font-semibold text-text-strong">
              {FONTE_DETECCAO_LABEL[obra.deteccao.fonte]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Detectado em</dt>
            <dd className="font-data font-semibold text-text-strong">
              {new Date(`${obra.deteccao.detectadoEm}T12:00:00Z`).toLocaleDateString("pt-BR")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Área detectada</dt>
            <dd className="font-data font-semibold text-text-strong">
              {M2.format(obra.deteccao.areaDetectadaM2)} m²
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Confiança do modelo</dt>
            <dd className="font-data font-semibold text-text-strong">
              {Math.round(obra.deteccao.confianca * 100)}%
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Valor estimado dos serviços</dt>
            <dd className="font-data text-sm font-bold text-text-strong">
              {BRL.format(obra.valorEstimadoObra)}
            </dd>
          </div>
        </dl>
        <p className="mt-2.5 border-t border-border pt-2.5 text-xs leading-relaxed text-muted-foreground">
          {obra.deteccao.resumo}
        </p>
      </div>

      {/* Lado declarado — NFS-e + alvará */}
      <div className="rounded-[var(--r-md)] border border-border p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-brand">
          <span className="flex size-6 items-center justify-center rounded-[var(--r-sm)] bg-brand-050">
            <FileCheck2Icon aria-hidden="true" className="size-3.5 text-brand" />
          </span>
          Declarado — NFS-e e alvará
        </p>
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Situação do alvará</dt>
            <dd className="font-semibold text-text-strong">
              {ALVARA_SITUACAO_LABEL[obra.alvara.situacao]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Alvará</dt>
            <dd className="font-data font-semibold text-text-strong">
              {obra.alvara.numero ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Área licenciada</dt>
            <dd className="font-data font-semibold text-text-strong">
              {areaLicenciada !== undefined ? `${M2.format(areaLicenciada)} m²` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">NFS-e construção (12m)</dt>
            <dd className="font-data font-semibold text-text-strong">
              {BRL.format(obra.nfseConstrucao12m)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Delta */}
      <footer
        className="rounded-[var(--r-md)] border border-border p-3.5"
        style={{ borderLeftWidth: 4, borderLeftColor: `var(--c-risk-${obra.severidade})` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Divergência estimada
        </p>
        <p className="mt-1 font-data text-lg font-bold text-[color:var(--c-risk-4-txt)]">
          {BRL.format(divergencia)}
        </p>
        {areaLicenciada !== undefined && obra.deteccao.areaDetectadaM2 > areaLicenciada ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Área detectada excede a licenciada em{" "}
            <span className="font-data font-semibold text-text-strong">
              {M2.format(obra.deteccao.areaDetectadaM2 - areaLicenciada)} m²
            </span>
            .
          </p>
        ) : null}
        {obra.alvara.situacao === "sem_alvara" ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nenhum alvará localizado para a intervenção detectada.
          </p>
        ) : null}
      </footer>
    </section>
  );
}
