"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  Building2Icon,
  FileTextIcon,
  HistoryIcon,
  Loader2Icon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { useMemo } from "react";

import type { Comunicacao, Contribuinte, StatusComunicacao } from "@fiscalcheck/shared-types";

import { ChannelIcon } from "@/components/communications/channel-icon";
import { ChannelPreview } from "@/components/communications/channel-preview";
import { ProbatoryTimeline } from "@/components/communications/probatory-timeline";
import {
  STATUS_LABEL_PT,
  STATUS_TONE,
  StatusStepper,
} from "@/components/communications/status-stepper";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";

/*
  Drill-in probatório de uma comunicação (T15).

  - Header: protocolo, canal, StatusBadge.
  - Contribuinte + destinatário (LGPD: dados mascarados).
  - Stepper "full" com timestamps por passo.
  - Preview multicanal (portal/e-mail/SMS/WhatsApp).
  - ProbatoryTimeline com hash/IP/UA por evento.
  - Resposta do contribuinte (se houver).

  Faz refetch por id para simular hydration real quando a API chegar.
*/

type Props = {
  comunicacaoId: string | null;
  fallback: Comunicacao[];
  taxpayerById: Map<string, Contribuinte>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatFull(ts?: string): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.toLocaleDateString("pt-BR")} · ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function CommunicationDetailSheet({
  comunicacaoId,
  fallback,
  taxpayerById,
  open,
  onOpenChange,
}: Props) {
  const fallbackItem = useMemo(
    () => fallback.find((c) => c.id === comunicacaoId) ?? null,
    [fallback, comunicacaoId],
  );

  const query = useQuery({
    queryKey: ["communications", comunicacaoId],
    enabled: comunicacaoId !== null,
    queryFn: () => apiRequest<Comunicacao>(`/communications/${comunicacaoId}`),
    initialData: fallbackItem ?? undefined,
  });

  const comunicacao = query.data ?? fallbackItem;
  const taxpayer = comunicacao ? taxpayerById.get(comunicacao.contribuinteId) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl md:!max-w-2xl">
        {!comunicacao ? (
          <div className="p-6 text-sm text-muted-foreground">
            Selecione uma comunicação para ver o rastreio probatório completo.
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-6">
            <SheetHeader className="gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  {comunicacao.protocolo}
                </span>
                <ChannelIcon canal={comunicacao.canal} showLabel />
              </div>
              <SheetTitle>{comunicacao.assunto}</SheetTitle>
              <SheetDescription>
                Vinculada ao caso{" "}
                <span className="font-mono text-text-strong">
                  {comunicacao.casoId.toUpperCase()}
                </span>
                {taxpayer ? ` · ${taxpayer.razaoSocial}` : ""}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <StatusBadge
                  kind="manual"
                  tone={STATUS_TONE[comunicacao.status as StatusComunicacao]}
                  label={STATUS_LABEL_PT[comunicacao.status as StatusComunicacao]}
                />
                {query.isFetching ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Loader2Icon aria-hidden className="size-3 animate-spin" /> Atualizando…
                  </span>
                ) : null}
              </div>
            </SheetHeader>

            {comunicacao.status === "falha" ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-[color:var(--c-risk-5)]/40 bg-[color-mix(in_srgb,var(--c-risk-5)_10%,var(--surface))] p-3 text-xs text-[color:var(--c-risk-5)]"
              >
                <AlertTriangleIcon aria-hidden className="mt-0.5 size-4" />
                <p>
                  Canal falhou em entregar a comunicação. Verifique se houve reenvio bem-sucedido em
                  outro canal — o histórico probatório abaixo é a fonte da verdade.
                </p>
              </div>
            ) : null}

            <section
              aria-label="Rastreio da comunicação"
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <h4 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldCheckIcon aria-hidden className="size-3.5 text-brand" />
                Rastreio ponta-a-ponta
              </h4>
              <StatusStepper
                status={comunicacao.status as StatusComunicacao}
                timestamps={{
                  enviada: comunicacao.enviadaEm,
                  entregue: comunicacao.entregueEm,
                  ciencia: comunicacao.cienciaEm,
                  respondida: comunicacao.respondidaEm,
                }}
              />
              {comunicacao.prazoRespostaEm ? (
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Prazo de resposta:{" "}
                  <span className="font-mono text-text-strong">
                    {formatFull(comunicacao.prazoRespostaEm)}
                  </span>
                </p>
              ) : null}
            </section>

            {taxpayer ? (
              <section
                aria-label="Contribuinte e destinatário"
                className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              >
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Building2Icon aria-hidden className="size-3.5" />
                  Contribuinte
                </h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Razão social</dt>
                    <dd className="text-foreground">{taxpayer.razaoSocial}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">CNPJ</dt>
                    <dd className="font-mono text-text-strong">{taxpayer.cnpjMascarado}</dd>
                  </div>
                </dl>
                <h5 className="mt-4 mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <UserIcon aria-hidden className="size-3" />
                  Destinatário desta comunicação
                </h5>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Nome</dt>
                    <dd className="text-foreground">{comunicacao.destinatario.nome}</dd>
                  </div>
                  {comunicacao.destinatario.email ? (
                    <div>
                      <dt className="text-muted-foreground">E-mail</dt>
                      <dd className="font-mono text-foreground">
                        {comunicacao.destinatario.email}
                      </dd>
                    </div>
                  ) : null}
                  {comunicacao.destinatario.telefoneMascarado ? (
                    <div>
                      <dt className="text-muted-foreground">Telefone</dt>
                      <dd className="font-mono text-foreground">
                        {comunicacao.destinatario.telefoneMascarado}
                      </dd>
                    </div>
                  ) : null}
                  {comunicacao.destinatario.portalUserId ? (
                    <div>
                      <dt className="text-muted-foreground">Portal user</dt>
                      <dd className="font-mono text-foreground">
                        {comunicacao.destinatario.portalUserId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}

            <section
              aria-label="Preview multicanal"
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileTextIcon aria-hidden className="size-3.5" />
                Preview do canal · {comunicacao.canal}
              </h4>
              <ChannelPreview comunicacao={comunicacao} />
            </section>

            {comunicacao.respostaConteudo ? (
              <section
                aria-label="Resposta do contribuinte"
                className="rounded-lg border border-[color:var(--c-risk-1)]/40 bg-[color-mix(in_srgb,var(--c-risk-1)_10%,var(--surface))] p-4"
              >
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--c-risk-1)]">
                  Resposta do contribuinte
                </h4>
                <p className="text-sm italic text-foreground">
                  &ldquo;{comunicacao.respostaConteudo}&rdquo;
                </p>
                {comunicacao.respondidaEm ? (
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    Recebida em {formatFull(comunicacao.respondidaEm)}
                  </p>
                ) : null}
              </section>
            ) : null}

            <section
              aria-label="Registro probatório"
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HistoryIcon aria-hidden className="size-3.5" />
                Registro probatório (imutável)
              </h4>
              <ProbatoryTimeline eventos={comunicacao.eventos} />
              <p className="mt-3 text-[10px] text-muted-foreground">
                Cada evento carrega hash sintético do payload — em produção este hash é assinado
                pela chave da SEFAZ municipal e serve como prova jurídica da comunicação (art. 26,
                Lei 11.419/2006).
              </p>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
