"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2Icon,
  ChevronLeftIcon,
  FileTextIcon,
  HistoryIcon,
  Loader2Icon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  CaseDecision,
  CaseDocument,
  Caso,
  Contribuinte,
  DecisionAction,
} from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { ApprovalModal } from "@/components/cases/approval-modal";
import { DecisionChainEntry } from "@/components/cases/decision-chain-entry";
import { NextActionPanel } from "@/components/cases/next-action-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Dossiê lateral (T13). Renderiza:
  - Header: identidade do caso, StatusBadge, badge AGENTE, score, valor.
  - Contribuinte: razão social, CNPJ mascarado, regime, atividade, sócios.
  - NextActionPanel: recomendação + CTAs (Aprovar/Ajustar/Rejeitar).
  - Evidências: divergências linkadas + observações.
  - DecisionChain: cadeia decisória append-only (fetched from /decisions).
  - Documentos: termos gerados; abre visualizador em Sheet aninhado.

  Ao concluir uma decisão, invalida `["cases"]`, `["cases", id]` e
  `["notifications"]` para o sino re-renderizar.
*/

type Props = {
  casoId: string | null;
  casos: Caso[];
  taxpayerById?: Map<string, Contribuinte>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DecisionResponse = {
  caso: Caso;
  decisao: CaseDecision;
  documento?: CaseDocument;
  notificacao?: { id: string };
};

type DecisionRequestBody = {
  action: DecisionAction;
  mfaCode: string;
  justificativa?: string;
  observacoes?: string;
};

const RECOMENDACAO_LABEL: Record<string, string> = {
  intimacao: "Emitir termo de intimação",
  autorregularizacao: "Encaminhar para autorregularização",
  fiscalizacao: "Emitir termo de início de fiscalização",
};

const DOCUMENT_KIND_LABEL: Record<CaseDocument["kind"], string> = {
  termo_intimacao: "Termo de Intimação",
  termo_inicio_fiscalizacao: "Termo de Início de Fiscalização",
};

const REGIME_LABEL: Record<Contribuinte["regime"], string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
};

const SITUACAO_LABEL: Record<Contribuinte["situacao"], string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  baixada: "Baixada",
  inapta: "Inapta",
  nula: "Nula",
};

const CURRENCY_BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function CaseDossieSheet({ casoId, casos, taxpayerById, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const [pendingAction, setPendingAction] = useState<DecisionAction | null>(null);
  const [viewingDocument, setViewingDocument] = useState<CaseDocument | null>(null);

  const caso = useMemo(() => casos.find((c) => c.id === casoId) ?? null, [casos, casoId]);
  const taxpayer = caso ? taxpayerById?.get(caso.contribuinteId) : undefined;

  const decisions = useQuery({
    queryKey: ["cases", casoId, "decisions"],
    enabled: casoId !== null,
    queryFn: () => apiRequest<CaseDecision[]>(`/cases/${casoId}/decisions`),
  });

  const documents = useQuery({
    queryKey: ["cases", casoId, "documents"],
    enabled: casoId !== null,
    queryFn: () => apiRequest<CaseDocument[]>(`/cases/${casoId}/documents`),
  });

  const decision = useMutation({
    mutationFn: async (payload: DecisionRequestBody) => {
      if (!casoId) throw new Error("Caso não selecionado.");
      return apiRequest<DecisionResponse>(`/cases/${casoId}/decisions`, {
        method: "POST",
        body: payload,
        headers: {
          "X-Actor-Role": role ?? "auditor",
          "X-Actor-Id": user?.id ?? `mock-${role ?? "auditor"}`,
          "X-Actor-Name": user?.displayName ?? "Auditor Fiscal",
        },
      });
    },
    onSuccess: (data) => {
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", casoId, "decisions"] });
      if (data.documento) {
        queryClient.invalidateQueries({ queryKey: ["cases", casoId, "documents"] });
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        data.documento
          ? `Decisão registrada — ${DOCUMENT_KIND_LABEL[data.documento.kind]} ${data.documento.numero} anexado.`
          : "Decisão registrada com sucesso.",
      );
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.code === "mfa_required"
          ? "MFA inválido — informe os 6 dígitos numéricos."
          : error instanceof Error
            ? error.message
            : "Falha ao registrar decisão.";
      toast.error(message);
    },
  });

  if (!caso) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <p className="text-sm text-muted-foreground">Selecione um caso na fila.</p>
        </SheetContent>
      </Sheet>
    );
  }

  const score = caso.scoreValor ?? 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-2xl md:!max-w-2xl"
        >
          <div className="flex flex-col gap-5 p-6">
            <SheetHeader className="gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  {caso.id.toUpperCase()}
                </span>
                {caso.agenteResponsavel ? <AgentRecommendationBadge /> : null}
              </div>
              <SheetTitle>{taxpayer?.razaoSocial ?? `Caso ${caso.contribuinteId}`}</SheetTitle>
              <SheetDescription>
                {taxpayer?.nomeFantasia ? `${taxpayer.nomeFantasia} · ` : ""}
                última atualização {new Date(caso.atualizadoEm).toLocaleString("pt-BR")}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <StatusBadge kind="status" status={caso.status} />
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold text-text-strong">{score}</span>
                  <span className="text-xs text-muted-foreground">score</span>
                </div>
                {caso.valorPotencial ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-lg font-semibold text-text-strong">
                      {CURRENCY_BRL.format(caso.valorPotencial)}
                    </span>
                    <span className="text-xs text-muted-foreground">potencial</span>
                  </div>
                ) : null}
              </div>
            </SheetHeader>

            {taxpayer ? (
              <section
                className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
                aria-label="Dados do contribuinte"
              >
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Building2Icon aria-hidden className="size-3.5" /> Contribuinte
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">CNPJ</dt>
                    <dd className="font-mono text-text-strong">{taxpayer.cnpjMascarado}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Inscrição municipal</dt>
                    <dd className="font-mono text-text-strong">
                      {taxpayer.inscricaoMunicipal ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Regime</dt>
                    <dd className="text-foreground">{REGIME_LABEL[taxpayer.regime]}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Situação</dt>
                    <dd className="text-foreground">{SITUACAO_LABEL[taxpayer.situacao]}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Atividade principal</dt>
                    <dd className="text-foreground">{taxpayer.atividadePrincipal ?? "—"}</dd>
                  </div>
                  {taxpayer.endereco ? (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Endereço</dt>
                      <dd className="text-foreground">
                        {taxpayer.endereco}, {taxpayer.municipio}/{taxpayer.uf}
                      </dd>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Município</dt>
                      <dd className="text-foreground">
                        {taxpayer.municipio}/{taxpayer.uf}
                      </dd>
                    </div>
                  )}
                  {caso.periodoApuracao ? (
                    <div>
                      <dt className="text-muted-foreground">Período apuração</dt>
                      <dd className="font-mono text-text-strong">{caso.periodoApuracao}</dd>
                    </div>
                  ) : null}
                  {caso.tributo ? (
                    <div>
                      <dt className="text-muted-foreground">Tributo</dt>
                      <dd className="font-mono uppercase text-text-strong">{caso.tributo}</dd>
                    </div>
                  ) : null}
                </dl>

                {taxpayer.socios && taxpayer.socios.length > 0 ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <h5 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <UsersIcon aria-hidden className="size-3" /> Sócios
                    </h5>
                    <ul className="flex flex-col gap-1.5 text-xs">
                      {taxpayer.socios.map((socio) => (
                        <li
                          key={`${socio.nome}-${socio.cpfMascarado}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-foreground">{socio.nome}</span>
                          <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                            <span>{socio.cpfMascarado}</span>
                            <span className="rounded-full bg-n-50 px-1.5 py-0.5">
                              {socio.participacao}%
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            <NextActionPanel
              caso={caso}
              onApprove={() => setPendingAction("aprovar")}
              onAdjust={() => setPendingAction("ajustar")}
              onReject={() => setPendingAction("rejeitar")}
              disabled={decision.isPending}
            />

            {caso.recomendacao ? (
              <section
                className="rounded-lg border border-border bg-surface p-4 text-sm shadow-[var(--e-1)]"
                aria-label="Recomendação estruturada"
              >
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <SparklesIcon aria-hidden className="size-3.5 text-brand" /> Recomendação
                </h4>
                <p className="mb-2 text-sm text-text-strong">
                  {RECOMENDACAO_LABEL[caso.recomendacao.acao] ?? caso.recomendacao.acao}
                </p>
                <p className="text-sm text-muted-foreground">{caso.recomendacao.justificativa}</p>
              </section>
            ) : null}

            <section
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              aria-label="Evidências do caso"
            >
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Evidências
              </h4>
              {caso.divergenciaIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma divergência vinculada — caso encerrado ou sem apontamentos.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {caso.divergenciaIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-full border border-border bg-n-25 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-foreground"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              )}
              {caso.observacoes ? (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  &ldquo;{caso.observacoes}&rdquo;
                </p>
              ) : null}
            </section>

            <section
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              aria-label="Cadeia decisória"
            >
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HistoryIcon aria-hidden className="size-3.5" /> Cadeia decisória
              </h4>
              {decisions.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2Icon aria-hidden className="size-3.5 animate-spin" /> Carregando
                  histórico…
                </div>
              ) : (decisions.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Ainda não há decisões registradas para este caso.
                </p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {(decisions.data ?? []).map((d) => (
                    <DecisionChainEntry key={d.id} decision={d} />
                  ))}
                </ol>
              )}
            </section>

            <section
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
              aria-label="Documentos gerados"
            >
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileTextIcon aria-hidden className="size-3.5" /> Documentos gerados
              </h4>
              {documents.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2Icon aria-hidden className="size-3.5 animate-spin" /> Carregando termos…
                </div>
              ) : (documents.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum termo emitido — aprovar uma recomendação de intimação ou fiscalização gera
                  o documento aqui.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(documents.data ?? []).map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
                    >
                      <div className="flex flex-col text-xs">
                        <span className="font-mono text-text-strong">{doc.numero}</span>
                        <span className="text-muted-foreground">
                          {DOCUMENT_KIND_LABEL[doc.kind]} · emitido em{" "}
                          {new Date(doc.emitidoEm).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <Button size="xs" variant="secondary" onClick={() => setViewingDocument(doc)}>
                        Ver documento
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <ApprovalModal
        action={pendingAction}
        caso={caso}
        submitting={decision.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={async (payload) => {
          await decision.mutateAsync(payload);
        }}
      />

      <Sheet
        open={viewingDocument !== null}
        onOpenChange={(next) => (!next ? setViewingDocument(null) : undefined)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl md:!max-w-xl">
          {viewingDocument ? (
            <div className={cn("flex flex-col gap-4 p-6")}>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-brand"
              >
                <ChevronLeftIcon aria-hidden className="size-3.5" /> Voltar ao dossiê
              </button>
              <SheetHeader className="gap-1">
                <SheetTitle>{DOCUMENT_KIND_LABEL[viewingDocument.kind]}</SheetTitle>
                <SheetDescription>
                  <span className="font-mono text-text-strong">{viewingDocument.numero}</span> ·{" "}
                  Emitido em {new Date(viewingDocument.emitidoEm).toLocaleString("pt-BR")}
                </SheetDescription>
              </SheetHeader>
              <pre className="whitespace-pre-wrap rounded-md border border-border bg-n-25 p-4 text-xs leading-relaxed text-foreground">
                {viewingDocument.conteudo}
              </pre>
              <p className="text-[10px] text-muted-foreground">
                Documento em modo de demonstração — versão final é gerada em PDF pelo módulo de
                emissão oficial (fora deste POC).
              </p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
