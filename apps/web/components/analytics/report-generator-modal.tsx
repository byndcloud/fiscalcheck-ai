"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheetIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  KpiTrend,
  MetaPiloto,
  RelatorioFormato,
  RelatorioTipo,
  SusAvaliacao,
} from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { computeSusMedia } from "@/lib/analytics/sus";
import { ApiError } from "@/lib/api-client";
import {
  type GenerateReportResult,
  generateReport,
  newReportCorrelationId,
} from "@/lib/reports/generate-report";
import {
  REPORT_SECOES_LABEL,
  REPORT_SECOES_PADRAO,
  REPORT_TIPO_LABEL,
  type ReportSectionKey,
} from "@/lib/reports/types";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Gerador de relatórios gerenciais (T17). Fluxo em 3 passos:

    1. Tipo (calibragem / validação) + período (usa o período do painel).
    2. Seções (checkboxes; pré-selecionadas por padrão do tipo).
    3. Prévia + botões "Gerar PDF" / "Gerar XLSX".

  RBAC: geração é restrita a supervisor/admin (o botão vive dentro
  do /analytics, que já filtra na sidebar; o MSW replica a checagem).
*/

const TODAY_ISO = () => new Date().toISOString();

const SECOES_TODAS: readonly ReportSectionKey[] = [
  "kpis",
  "metas",
  "risco_distribuicao",
  "sus",
  "casos_criticos",
  "trilha_auditoria",
];

type ReportGeneratorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpis: readonly KpiTrend[];
  metas: readonly MetaPiloto[];
  susAvaliacoes: readonly SusAvaliacao[];
};

function periodoLabel(inicio: string, fim: string): string {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
  return `${fmt(inicio)} — ${fmt(fim)}`;
}

export function ReportGeneratorModal({
  open,
  onOpenChange,
  kpis,
  metas,
  susAvaliacoes,
}: ReportGeneratorModalProps) {
  const queryClient = useQueryClient();
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tipo, setTipo] = useState<RelatorioTipo>("validacao");
  const [secoes, setSecoes] = useState<ReportSectionKey[]>([...REPORT_SECOES_PADRAO.validacao]);
  const [periodo, setPeriodo] = useState<{ inicio: string; fim: string }>(() => {
    const now = new Date();
    const inicio = new Date(now);
    inicio.setDate(inicio.getDate() - 30);
    return { inicio: inicio.toISOString(), fim: now.toISOString() };
  });

  const susMedia = useMemo(
    () => computeSusMedia(susAvaliacoes.map((s) => s.score)),
    [susAvaliacoes],
  );

  const mutation = useMutation<GenerateReportResult, Error, RelatorioFormato>({
    mutationFn: async (formato) => {
      const correlationId = newReportCorrelationId();
      return await generateReport({
        formato,
        actor: {
          id: user?.id ?? `mock-${role ?? "supervisor"}`,
          displayName: user?.displayName ?? "Gestor",
          role: role ?? "supervisor",
        },
        data: {
          tipo,
          titulo: REPORT_TIPO_LABEL[tipo],
          subtitulo: `Piloto Brusque · ${periodoLabel(periodo.inicio, periodo.fim)}`,
          emitidoPor: {
            displayName: user?.displayName ?? "Gestor",
            role: role ?? "supervisor",
            id: user?.id ?? "mock",
          },
          emitidoEm: TODAY_ISO(),
          periodo,
          correlationId,
          secoes,
          kpis,
          metas,
          susAvaliacoes,
          susMedia,
        },
      });
    },
    onSuccess: (result) => {
      toast.success("Relatório gerado", {
        description: `${result.filename} — registrado na trilha (${result.response.correlationId.slice(-8)}).`,
      });
      queryClient.invalidateQueries({ queryKey: ["compliance", "audit-log-v2"] });
      onOpenChange(false);
      setStep(1);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? `${error.message} (${error.code})`
          : error.message || "Falha ao gerar o relatório.";
      toast.error("Não foi possível gerar o relatório", { description: message });
    },
  });

  const handleTipoChange = (next: RelatorioTipo) => {
    setTipo(next);
    setSecoes([...REPORT_SECOES_PADRAO[next]]);
  };

  const toggleSecao = (key: ReportSectionKey) => {
    setSecoes((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar relatório gerencial</DialogTitle>
          <DialogDescription>
            Documento assinado pelo gestor emissor, com correlation id auditável na trilha.
          </DialogDescription>
        </DialogHeader>

        {/* Passo 1: tipo + período */}
        {step === 1 ? (
          <section className="grid gap-4" aria-labelledby="passo-1">
            <h3 id="passo-1" className="text-sm font-semibold text-[#121826]">
              1 · Tipo e período
            </h3>
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Tipo de relatório"
            >
              {(["calibragem", "validacao"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  // biome-ignore lint/a11y/useSemanticElements: card visual clicável (radio + descrição rica) — <input type="radio"> não permite estilo de card; semântica preservada por role="radio" + aria-checked no botão e role="radiogroup" no pai.
                  role="radio"
                  aria-checked={tipo === t}
                  onClick={() => handleTipoChange(t)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2",
                    tipo === t
                      ? "border-[#1351b4] bg-[#eaf2fd]"
                      : "border-[#e1e6f0] bg-white hover:border-[#c1d4ee]",
                  )}
                >
                  <p className="text-sm font-semibold text-[#121826]">{REPORT_TIPO_LABEL[t]}</p>
                  <p className="mt-1 text-[12px] text-[#54607a] leading-snug">
                    {t === "calibragem"
                      ? "Snapshot do modelo de risco: pesos, faixas, evolução e resíduos."
                      : "Indicadores de aceitação do piloto: KPIs, metas, SUS e casos críticos."}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold text-[#54607a]">Início do período</span>
                <input
                  type="date"
                  value={periodo.inicio.slice(0, 10)}
                  onChange={(e) =>
                    setPeriodo((prev) => ({
                      ...prev,
                      inicio: new Date(e.target.value).toISOString(),
                    }))
                  }
                  className="rounded-lg border border-[#e1e6f0] bg-white px-3 py-2 text-sm text-[#121826] focus:border-[#1351b4] focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-1"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold text-[#54607a]">Fim do período</span>
                <input
                  type="date"
                  value={periodo.fim.slice(0, 10)}
                  onChange={(e) =>
                    setPeriodo((prev) => ({
                      ...prev,
                      fim: new Date(e.target.value).toISOString(),
                    }))
                  }
                  className="rounded-lg border border-[#e1e6f0] bg-white px-3 py-2 text-sm text-[#121826] focus:border-[#1351b4] focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-1"
                />
              </label>
            </div>
          </section>
        ) : null}

        {/* Passo 2: seções */}
        {step === 2 ? (
          <section className="grid gap-3" aria-labelledby="passo-2">
            <h3 id="passo-2" className="text-sm font-semibold text-[#121826]">
              2 · Seções a incluir
            </h3>
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">Seções</legend>
              {SECOES_TODAS.map((key) => {
                const checked = secoes.includes(key);
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors",
                      checked
                        ? "border-[#1351b4] bg-[#eaf2fd]"
                        : "border-[#e1e6f0] bg-white hover:border-[#c1d4ee]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSecao(key)}
                      className="mt-1 size-4 rounded border-[#c1c9d9] text-[#1351b4] focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1"
                    />
                    <span className="text-[13px] text-[#121826]">{REPORT_SECOES_LABEL[key]}</span>
                  </label>
                );
              })}
            </fieldset>
          </section>
        ) : null}

        {/* Passo 3: prévia */}
        {step === 3 ? (
          <section className="grid gap-3" aria-labelledby="passo-3">
            <h3 id="passo-3" className="text-sm font-semibold text-[#121826]">
              3 · Confirmação
            </h3>
            <dl className="grid gap-2 rounded-xl border border-[#e1e6f0] bg-[#f9fbff] p-4 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[#54607a]">Tipo</dt>
                <dd className="font-semibold text-[#121826]">{REPORT_TIPO_LABEL[tipo]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#54607a]">Período</dt>
                <dd className="font-semibold text-[#121826]">
                  {periodoLabel(periodo.inicio, periodo.fim)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#54607a]">Seções</dt>
                <dd className="text-right font-semibold text-[#121826]">
                  {secoes.length === 0
                    ? "nenhuma"
                    : secoes.map((s) => REPORT_SECOES_LABEL[s]).join(" · ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#54607a]">Emitido por</dt>
                <dd className="font-semibold text-[#121826]">{user?.displayName ?? "Gestor"}</dd>
              </div>
            </dl>
            {secoes.length === 0 ? (
              <p className="rounded-md border border-[#f2a900] bg-[#fff5cf] px-3 py-2 text-[12px] text-[#7a5300]">
                Selecione pelo menos uma seção antes de gerar o relatório.
              </p>
            ) : null}
          </section>
        ) : null}

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-1 text-[12px] text-[#66718a]">
            Passo {step} de 3
          </div>
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              >
                Voltar
              </Button>
            ) : null}
            {step < 3 ? (
              <Button type="button" size="sm" onClick={() => setStep((s) => (s === 1 ? 2 : 3))}>
                Continuar
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={secoes.length === 0 || mutation.isPending}
                  onClick={() => mutation.mutate("xlsx")}
                  aria-label="Gerar XLSX"
                >
                  {mutation.isPending && mutation.variables === "xlsx" ? (
                    <Loader2Icon aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileSpreadsheetIcon aria-hidden="true" className="mr-2 size-4" />
                  )}
                  Gerar XLSX
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={secoes.length === 0 || mutation.isPending}
                  onClick={() => mutation.mutate("pdf")}
                  aria-label="Gerar PDF"
                >
                  {mutation.isPending && mutation.variables === "pdf" ? (
                    <Loader2Icon aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileTextIcon aria-hidden="true" className="mr-2 size-4" />
                  )}
                  Gerar PDF
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
