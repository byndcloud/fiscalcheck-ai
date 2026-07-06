"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, InboxIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Caso, CitizenInteracao, DevolutivaAcao } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api-client";
import { useSession } from "@/stores/session-store";

/*
  Caixa de devolutivas eletrônicas (T14 · RF04).
  Devolutivas tratáveis (contestação, adesão, agendamento) chegam com a
  pré-triagem do agente; o auditor responde com Acatar / Manter /
  Solicitar complemento + justificativa obrigatória — decisão humana
  registrada com autoria (AGENTS.md §1.1).
*/

const TIPO_LABEL: Record<CitizenInteracao["tipo"], string> = {
  ciencia: "Ciência",
  adesao_parcelamento: "Adesão ao parcelamento",
  guia_emitida: "Guia emitida",
  contestacao: "Contestação",
  agendamento: "Agendamento",
};

const ACAO_LABEL: Record<DevolutivaAcao, string> = {
  acatar: "Acatar",
  manter: "Manter divergência",
  solicitar_complemento: "Solicitar complemento",
};

const ACAO_DESCRICAO: Record<DevolutivaAcao, string> = {
  acatar: "Aceita a manifestação do contribuinte e ajusta a instrução do caso.",
  manter: "Confirma a divergência apurada — a manifestação não altera o caso.",
  solicitar_complemento: "Pede documentos ou esclarecimentos adicionais ao contribuinte.",
};

type TratamentoResponse = { interacao: CitizenInteracao; caso: Caso };

type Props = {
  casoId: string;
  interacoes: CitizenInteracao[];
};

export function DevolutivasPanel({ casoId, interacoes }: Props) {
  const queryClient = useQueryClient();
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);

  const [respondendo, setRespondendo] = useState<CitizenInteracao | null>(null);
  const [acao, setAcao] = useState<DevolutivaAcao | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const tratamento = useMutation({
    mutationFn: (payload: { interacaoId: string; acao: DevolutivaAcao; justificativa: string }) =>
      apiRequest<TratamentoResponse>(
        `/cases/${casoId}/interacoes/${payload.interacaoId}/tratamento`,
        {
          method: "POST",
          body: { acao: payload.acao, justificativa: payload.justificativa },
          headers: {
            "X-Actor-Role": role ?? "auditor",
            "X-Actor-Id": user?.id ?? `mock-${role ?? "auditor"}`,
            "X-Actor-Name": user?.displayName ?? "Auditor Fiscal",
          },
        },
      ),
    onSuccess: (data) => {
      toast.success(
        `Devolutiva ${data.interacao.protocolo} tratada: ${ACAO_LABEL[data.interacao.tratamento?.acao ?? "acatar"]}.`,
      );
      fecharDialogo();
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", casoId, "interacoes"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao tratar a devolutiva.");
    },
  });

  function fecharDialogo() {
    setRespondendo(null);
    setAcao(null);
    setJustificativa("");
  }

  // Só entram na caixa as devolutivas que pedem resposta do auditor.
  const trataveis = interacoes.filter((i) => i.preTriagem || i.tratamento);

  return (
    <section
      className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
      aria-label="Devolutivas eletrônicas do contribuinte"
    >
      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <InboxIcon aria-hidden className="size-3.5" /> Devolutivas do contribuinte
      </h4>

      {trataveis.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma devolutiva eletrônica recebida — respostas, contestações e comprovantes do
          contribuinte aparecem aqui.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trataveis.map((interacao) => (
            <li
              key={interacao.id}
              className="rounded-[var(--r-md)] border border-border bg-n-25 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-text-strong">
                  {TIPO_LABEL[interacao.tipo]}
                  <span className="ml-2 font-data font-normal text-muted-foreground">
                    {interacao.protocolo}
                  </span>
                </p>
                <time
                  dateTime={interacao.criadoEm}
                  className="font-data text-[11px] text-muted-foreground"
                >
                  {new Date(interacao.criadoEm).toLocaleString("pt-BR")}
                </time>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-foreground">{interacao.resumo}</p>

              {interacao.preTriagem && !interacao.tratamento ? (
                <div className="mt-2 rounded-[var(--r-sm)] border border-brand-100 bg-brand-050/60 p-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-deep">
                    <SparklesIcon aria-hidden className="size-3" /> Pré-triagem do agente
                    <AgentRecommendationBadge />
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">
                    {interacao.preTriagem.resumo}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Sugestão: <strong>{ACAO_LABEL[interacao.preTriagem.recomendacao]}</strong> ·
                    confiança {Math.round(interacao.preTriagem.confianca * 100)}% — a decisão é do
                    auditor.
                  </p>
                </div>
              ) : null}

              {interacao.tratamento ? (
                <div className="mt-2 flex items-start gap-2 rounded-[var(--r-sm)] border border-[color:var(--c-success)]/40 bg-[color-mix(in_srgb,var(--c-success)_8%,var(--surface))] p-2.5">
                  <CheckCircle2Icon
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-[color:var(--c-success)]"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-text-strong">
                      {ACAO_LABEL[interacao.tratamento.acao]} por{" "}
                      {interacao.tratamento.tratadoPorNome}
                      <span className="ml-1.5 font-data font-normal text-muted-foreground">
                        {new Date(interacao.tratamento.tratadoEm).toLocaleString("pt-BR")}
                      </span>
                    </p>
                    <p className="mt-0.5 leading-relaxed text-muted-foreground">
                      {interacao.tratamento.justificativa}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(Object.keys(ACAO_LABEL) as DevolutivaAcao[]).map((opcao) => (
                    <Button
                      key={opcao}
                      type="button"
                      size="xs"
                      variant={interacao.preTriagem?.recomendacao === opcao ? "default" : "outline"}
                      onClick={() => {
                        setRespondendo(interacao);
                        setAcao(opcao);
                        setJustificativa("");
                      }}
                    >
                      {ACAO_LABEL[opcao]}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={respondendo !== null && acao !== null}
        onOpenChange={(open) => (!open ? fecharDialogo() : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{acao ? ACAO_LABEL[acao] : ""}</DialogTitle>
            <DialogDescription>
              {acao ? ACAO_DESCRICAO[acao] : ""} O tratamento fica registrado na linha do tempo do
              caso com sua autoria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label
              htmlFor="tratamento-justificativa"
              className="text-xs font-medium text-foreground"
            >
              Justificativa (obrigatória)
            </label>
            <Textarea
              id="tratamento-justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Fundamente o tratamento da devolutiva…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={fecharDialogo}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={justificativa.trim().length < 10 || tratamento.isPending}
              onClick={() => {
                if (!respondendo || !acao) return;
                tratamento.mutate({
                  interacaoId: respondendo.id,
                  acao,
                  justificativa: justificativa.trim(),
                });
              }}
            >
              {tratamento.isPending ? "Registrando…" : "Registrar tratamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
