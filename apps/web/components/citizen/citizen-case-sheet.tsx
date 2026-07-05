"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlusIcon,
  CheckCircle2Icon,
  HandshakeIcon,
  Loader2Icon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  ReceiptTextIcon,
  ShieldIcon,
  SmartphoneIcon,
} from "lucide-react";
import { useState } from "react";

import type {
  Caso,
  CitizenActionResponse,
  CitizenInteracao,
  Divergencia,
  GuiaDam,
} from "@fiscalcheck/shared-types";

import { AgendamentoDialog } from "@/components/citizen/agendamento-dialog";
import {
  CITIZEN_STATUS_LABEL,
  CITIZEN_STATUS_TONE,
  CURRENCY_BRL,
  TRIBUTO_LABEL,
  deriveStep,
  hasCiencia,
} from "@/components/citizen/case-labels";
import { CitizenStepper } from "@/components/citizen/citizen-stepper";
import { ContestacaoDialog } from "@/components/citizen/contestacao-dialog";
import { GuiaDialog } from "@/components/citizen/guia-dialog";
import { ParcelamentoDialog } from "@/components/citizen/parcelamento-dialog";
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
import { explainDivergencia, summarizeValor } from "@/lib/citizen/plain-language";
import { notify } from "@/lib/toast";

/*
  Detalhe da pendência no Portal do Contribuinte (T16 · módulo 4).
  Mobile-first: Sheet ocupa a tela inteira em < sm. Fluxo acolhedor:
  stepper de 3 passos → explicação em linguagem clara → valores →
  ações de regularização → acompanhamento em tempo real.

  Toda ação gera protocolo e devolutiva ao auditor (aceite T16 × T14).
*/

type Props = {
  caso: Caso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const INTERACAO_LABEL: Record<CitizenInteracao["tipo"], string> = {
  ciencia: "Ciência registrada",
  adesao_parcelamento: "Adesão ao parcelamento",
  guia_emitida: "Guia emitida",
  contestacao: "Contestação enviada",
  agendamento: "Atendimento agendado",
};

export function CitizenCaseSheet({ caso, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [guiaVisivel, setGuiaVisivel] = useState<GuiaDam | null>(null);
  const [parcelamentoOpen, setParcelamentoOpen] = useState(false);
  const [contestacaoOpen, setContestacaoOpen] = useState(false);
  const [agendamentoOpen, setAgendamentoOpen] = useState(false);

  const casoId = caso?.id ?? null;

  const divergencias = useQuery({
    queryKey: ["citizen", "cases", casoId, "divergencias"],
    enabled: open && casoId !== null,
    queryFn: () => apiRequest<Divergencia[]>(`/citizen/cases/${casoId}/divergencias`),
    meta: { silent: true },
  });

  const interacoes = useQuery({
    queryKey: ["citizen", "cases", casoId, "interacoes"],
    enabled: open && casoId !== null,
    queryFn: () => apiRequest<CitizenInteracao[]>(`/citizen/cases/${casoId}/interacoes`),
    meta: { silent: true },
  });

  const ciencia = useMutation({
    mutationFn: () =>
      apiRequest<CitizenActionResponse>(`/citizen/cases/${casoId}/ciencia`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["citizen"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      notify.success("Ciência registrada.", {
        description: `Protocolo ${data.interacao.protocolo}. Agora escolha como regularizar.`,
      });
    },
  });

  const guiaIntegral = useMutation({
    mutationFn: () =>
      apiRequest<CitizenActionResponse>(`/citizen/cases/${casoId}/guia`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["citizen"] });
      notify.success("Guia emitida.", {
        description: `Protocolo ${data.interacao.protocolo}.`,
      });
      if (data.guia) setGuiaVisivel(data.guia);
    },
  });

  if (!caso) return null;

  const timeline = interacoes.data ?? [];
  const cienciaFeita = hasCiencia(caso, timeline);
  const step = deriveStep(caso, timeline);
  const encerrado = caso.status === "encerrado";
  const emFiscalizacao = caso.status === "fiscalizacao";
  const podeRegularizar = cienciaFeita && !encerrado && (caso.valorPotencial ?? 0) > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <SheetHeader className="gap-2 p-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  {caso.id.toUpperCase()}
                </span>
                <StatusBadge
                  kind="manual"
                  tone={CITIZEN_STATUS_TONE[caso.status]}
                  label={CITIZEN_STATUS_LABEL[caso.status]}
                />
              </div>
              <SheetTitle className="text-lg">
                {caso.tributo ? TRIBUTO_LABEL[caso.tributo] : "Pendência fiscal"}
              </SheetTitle>
              <SheetDescription>
                {caso.periodoApuracao ? `Período: ${caso.periodoApuracao} · ` : ""}
                atualizado em {new Date(caso.atualizadoEm).toLocaleDateString("pt-BR")}
              </SheetDescription>
            </SheetHeader>

            <CitizenStepper current={step.current} done={step.done} />

            {/* Explicação em linguagem clara (RF07) */}
            <section
              aria-label="Entenda a situação"
              className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Entenda a situação
              </h4>
              {divergencias.isLoading ? (
                <SkeletonText lines={3} />
              ) : (divergencias.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {encerrado
                    ? "Esta pendência foi resolvida. Obrigado por regularizar sua situação."
                    : "A equipe da Fazenda está preparando o detalhamento desta pendência."}
                </p>
              ) : (
                (divergencias.data ?? []).map((divergencia) => {
                  const plain = explainDivergencia(divergencia);
                  const valorResumo = summarizeValor(divergencia);
                  return (
                    <div key={divergencia.id} className="grid gap-1.5">
                      <p className="text-sm font-semibold text-text-strong">{plain.titulo}</p>
                      <p className="text-sm leading-relaxed text-foreground">{plain.explicacao}</p>
                      {valorResumo ? (
                        <p className="text-xs text-muted-foreground">{valorResumo}</p>
                      ) : null}
                      <p className="rounded-md bg-brand-050 p-2.5 text-xs leading-relaxed text-brand-deep">
                        {plain.oQueFazer}
                      </p>
                    </div>
                  );
                })
              )}
            </section>

            {/* Valores e prazo */}
            {(caso.valorPotencial ?? 0) > 0 ? (
              <section
                aria-label="Valores"
                className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              >
                <div className="grid gap-0.5">
                  <p className="text-xs text-muted-foreground">Valor a regularizar</p>
                  <p className="font-display text-3xl text-text-strong">
                    {CURRENCY_BRL.format(caso.valorPotencial ?? 0)}
                  </p>
                </div>
                {caso.prazoLimite ? (
                  <div className="grid gap-0.5 text-right">
                    <p className="text-xs text-muted-foreground">Prazo para resposta</p>
                    <p className="font-mono text-sm font-semibold text-text-strong">
                      {new Date(`${caso.prazoLimite}T12:00:00Z`).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Passo 1 — ciência */}
            {!cienciaFeita && !encerrado ? (
              <section
                aria-label="Registrar ciência"
                className="grid gap-3 rounded-lg border border-brand/30 bg-brand-050 p-4"
              >
                <p className="text-sm leading-relaxed text-brand-deep">
                  <strong>Primeiro passo:</strong> confirme que você recebeu este aviso. O registro
                  gera um protocolo e libera as opções de regularização.
                </p>
                <Button
                  className="w-full sm:w-fit"
                  onClick={() => ciencia.mutate()}
                  disabled={ciencia.isPending}
                >
                  {ciencia.isPending ? (
                    <>
                      <Loader2Icon aria-hidden className="size-4 animate-spin" />
                      Registrando…
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon aria-hidden className="size-4" />
                      Confirmar ciência do aviso
                    </>
                  )}
                </Button>
              </section>
            ) : null}

            {/* Passo 2 — regularização */}
            {!encerrado && cienciaFeita ? (
              <section
                aria-label="Como regularizar"
                className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Como você prefere resolver?
                </h4>
                {emFiscalizacao ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Esta pendência está em ação fiscal. Você ainda pode enviar documentos pela
                    contestação ou agendar um atendimento com a equipe.
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {podeRegularizar && !emFiscalizacao ? (
                    <>
                      <Button
                        variant="default"
                        className="w-full justify-start"
                        onClick={() => guiaIntegral.mutate()}
                        disabled={guiaIntegral.isPending}
                      >
                        {guiaIntegral.isPending ? (
                          <Loader2Icon aria-hidden className="size-4 animate-spin" />
                        ) : (
                          <ReceiptTextIcon aria-hidden className="size-4" />
                        )}
                        Emitir guia e pagar à vista
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => setParcelamentoOpen(true)}
                      >
                        <HandshakeIcon aria-hidden className="size-4" />
                        Simular parcelamento
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setContestacaoOpen(true)}
                  >
                    <MessageSquareTextIcon aria-hidden className="size-4" />
                    Não concordo — contestar
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setAgendamentoOpen(true)}
                  >
                    <CalendarPlusIcon aria-hidden className="size-4" />
                    Agendar atendimento
                  </Button>
                </div>
              </section>
            ) : null}

            {/* Acompanhamento em tempo real */}
            <section
              aria-label="Acompanhamento"
              className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Acompanhamento
              </h4>
              {interacoes.isLoading ? (
                <SkeletonText lines={2} />
              ) : timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Suas ações aparecerão aqui com o protocolo de cada uma.
                </p>
              ) : (
                <ol className="grid gap-2.5">
                  {timeline.map((interacao) => (
                    <li key={interacao.id} className="grid gap-0.5 border-l-2 border-brand pl-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-xs font-semibold text-text-strong">
                          {INTERACAO_LABEL[interacao.tipo]}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {interacao.protocolo}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {interacao.resumo}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(interacao.criadoEm).toLocaleString("pt-BR")}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span>Você também recebe avisos por:</span>
                <span className="inline-flex items-center gap-1">
                  <MailIcon aria-hidden className="size-3" /> E-mail
                </span>
                <span className="inline-flex items-center gap-1">
                  <SmartphoneIcon aria-hidden className="size-3" /> SMS
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircleIcon aria-hidden className="size-3" /> WhatsApp
                </span>
              </div>
            </section>

            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Estas informações são protegidas por sigilo fiscal (art. 198 do CTN) e só são exibidas
              após a sua identificação. Dúvidas sobre privacidade? Consulte nossa política de
              privacidade e o contato do Encarregado de Dados (DPO).
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <ParcelamentoDialog
        caso={caso}
        open={parcelamentoOpen}
        onOpenChange={setParcelamentoOpen}
        onGuia={(guia) => setGuiaVisivel(guia)}
      />
      <ContestacaoDialog caso={caso} open={contestacaoOpen} onOpenChange={setContestacaoOpen} />
      <AgendamentoDialog caso={caso} open={agendamentoOpen} onOpenChange={setAgendamentoOpen} />
      <GuiaDialog guia={guiaVisivel} onClose={() => setGuiaVisivel(null)} />
    </>
  );
}
