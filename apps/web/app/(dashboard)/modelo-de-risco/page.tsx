"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  Contribuinte,
  RiskModelChange,
  RiskModelConfig,
  RiskModelPublishResponse,
  Score,
} from "@fiscalcheck/shared-types";

import { PublishConfirmDialog } from "@/components/risk-model/publish-confirm-dialog";
import { type RiskModelDraft, RiskModelForm } from "@/components/risk-model/risk-model-form";
import { RiskModelHistory } from "@/components/risk-model/risk-model-history";
import { RiskModelPreview } from "@/components/risk-model/risk-model-preview";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError, apiRequest } from "@/lib/api-client";
import { diffConfigs, simulateAll } from "@/lib/risk-model/simulate";
import { ROLE_LABEL_PT } from "@/lib/roles";
import { useSession } from "@/stores/session-store";

/*
  Página /modelo-de-risco (T02 · módulo 3 — IA Preditiva).

  Perfil autorizado: Gestor (supervisor) e Administrador (admin). O guard
  aqui é defense-in-depth: a sidebar já esconde o item para Auditor e
  Cidadão (que aliás nem chega em /(dashboard)/*), e o MSW recusa o POST
  com HTTP 403 se `X-Actor-Role` não for gestor/admin. Nunca há caminho
  válido para outros papéis alcançarem a configuração.

  Orquestra:
   - fetch da config vigente + histórico + scores + contribuintes
   - draft local (weights/bands/rules) sincronizado com a versão vigente
   - preview em tempo real via `simulateAll`
   - publish com confirm dialog + justificativa + invalidação de cache
*/

const FIELDS_LABEL: Record<string, string> = {
  "weights.cruzamento": "Peso · Cruzamento",
  "weights.grafo": "Peso · Grafo",
  "weights.cadastro": "Peso · Cadastro",
  "weights.historico": "Peso · Histórico",
  "bands.baixo": "Faixa · Conforme→Baixo",
  "bands.medio": "Faixa · Baixo→Médio",
  "bands.alto": "Faixa · Médio→Alto",
  "bands.critico": "Faixa · Alto→Crítico",
};

function labelFieldsChanged(fields: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fields) {
    if (FIELDS_LABEL[field]) {
      map[field] = FIELDS_LABEL[field];
    } else if (field.startsWith("rules.")) {
      map[field] = "Regra de detecção";
    } else {
      map[field] = field;
    }
  }
  return map;
}

function buildDefaultSummary(
  fieldsChanged: readonly string[],
  fieldsLabels: Record<string, string>,
): string {
  if (fieldsChanged.length === 0) return "Ajustes na configuração do modelo de risco.";
  const parts = fieldsChanged.slice(0, 3).map((f) => fieldsLabels[f] ?? f);
  const remainder = fieldsChanged.length > 3 ? ` e mais ${fieldsChanged.length - 3} campo(s)` : "";
  return `Alterações em ${parts.join(", ")}${remainder}.`;
}

export default function RiskModelPage() {
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const queryClient = useQueryClient();

  const canConfigure = role === "supervisor" || role === "admin";

  const configQuery = useQuery({
    queryKey: ["risk-model", "config"],
    queryFn: () => apiRequest<RiskModelConfig>("/ai/risk-model/config"),
    enabled: canConfigure,
  });

  const historyQuery = useQuery({
    queryKey: ["risk-model", "history"],
    queryFn: () => apiRequest<RiskModelChange[]>("/ai/risk-model/history"),
    enabled: canConfigure,
  });

  const scoresQuery = useQuery({
    queryKey: ["ai", "scores"],
    queryFn: () => apiRequest<Score[]>("/ai/scores"),
    staleTime: 60_000,
    enabled: canConfigure,
  });

  const taxpayersQuery = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    staleTime: 5 * 60 * 1000,
    enabled: canConfigure,
  });

  const [draft, setDraft] = useState<RiskModelDraft | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const baseline = configQuery.data;
  const baselineVersion = baseline?.version;

  /*
    Sincroniza o draft com a versão vigente:
    - primeiro fetch (draft ainda null) → inicializa;
    - troca de versão vigente (publish local ou remoto) → reseta o
      rascunho para não deixar edições órfãs sobre uma base defasada.
    O useEffect roda quando `baselineVersion` muda; a versão é a
    chave estável para detectar "a config publicada não é mais a mesma".
  */
  // biome-ignore lint/correctness/useExhaustiveDependencies: baseline lido intencionalmente pela version — deps completas causariam reset a cada refetch
  useEffect(() => {
    if (!baseline) return;
    setDraft({
      weights: { ...baseline.weights },
      bands: { ...baseline.bands },
      rules: baseline.rules.map((rule) => ({ ...rule })),
    });
  }, [baselineVersion]);

  const taxpayerById = useMemo(() => {
    const map = new Map<string, Contribuinte>();
    for (const t of taxpayersQuery.data ?? []) map.set(t.id, t);
    return map;
  }, [taxpayersQuery.data]);

  const draftAsConfig = useMemo<RiskModelConfig | null>(() => {
    if (!draft || !baseline) return null;
    return {
      ...baseline,
      weights: draft.weights,
      bands: draft.bands,
      rules: draft.rules,
    };
  }, [draft, baseline]);

  const simulation = useMemo(() => {
    if (!draftAsConfig || !scoresQuery.data) return null;
    return simulateAll(scoresQuery.data, draftAsConfig);
  }, [draftAsConfig, scoresQuery.data]);

  const fieldsChanged = useMemo(() => {
    if (!draft || !baseline) return [];
    return diffConfigs(baseline, draft);
  }, [draft, baseline]);

  const bandsValid =
    !!draft &&
    0 < draft.bands.baixo &&
    draft.bands.baixo < draft.bands.medio &&
    draft.bands.medio < draft.bands.alto &&
    draft.bands.alto < draft.bands.critico &&
    draft.bands.critico <= 100;

  const hasDraftChanges = fieldsChanged.length > 0;

  const publish = useMutation({
    mutationFn: async (justification: string) => {
      if (!draft) throw new Error("Rascunho não carregado.");
      const fieldsLabels = labelFieldsChanged(fieldsChanged);
      const summary = `${justification} — ${buildDefaultSummary(fieldsChanged, fieldsLabels)}`;
      return apiRequest<RiskModelPublishResponse>("/ai/risk-model/config", {
        method: "POST",
        body: {
          weights: draft.weights,
          bands: draft.bands,
          rules: draft.rules,
          summary,
          fieldsChanged,
        },
        headers: {
          "X-Actor-Role": role ?? "supervisor",
          "X-Actor-Id": user?.id ?? `mock-${role ?? "supervisor"}`,
          "X-Actor-Name": user?.displayName ?? "Gestor",
        },
      });
    },
    onSuccess: (data) => {
      /*
        A troca da versão vigente na cache dispara o useEffect que reseta
        o draft — assim o rascunho fica igual ao publicado imediatamente.
      */
      queryClient.setQueryData(["risk-model", "config"], data.config);
      queryClient.invalidateQueries({ queryKey: ["risk-model", "history"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "scores"] });
      setPublishOpen(false);
      setPublishError(null);
      toast.success(`Modelo ${data.config.version} publicado — auditoria registrada.`);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao publicar a nova versão do modelo.";
      setPublishError(message);
      toast.error(message);
    },
  });

  if (!canConfigure) {
    return (
      <div className="grid gap-5">
        <PageHeader
          title="Configuração do modelo de risco"
          description="Parâmetros do score preditivo do FiscalCheck AI. Módulo 3."
        />
        <ForbiddenNotice roleLabel={role ? ROLE_LABEL_PT[role] : "Perfil desconhecido"} />
      </div>
    );
  }

  const isLoading =
    configQuery.isLoading || scoresQuery.isLoading || historyQuery.isLoading || !draft;

  const anyError = configQuery.isError || scoresQuery.isError || historyQuery.isError;

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Configuração do modelo de risco"
        description="Parametrize pesos por categoria, faixas de score e regras de detecção. Toda publicação é registrada em cadeia de auditoria (T19). Módulo 3."
        action={
          baseline ? (
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Vigente
              </span>
              <span className="font-data text-sm font-bold text-text-strong">
                {baseline.version}
              </span>
              <span className="text-[11px] text-muted-foreground">
                por {baseline.updatedBy} · {ROLE_LABEL_PT[baseline.updatedByRole]}
              </span>
            </div>
          ) : null
        }
      />

      {isLoading ? (
        <output
          aria-live="polite"
          className="flex items-center gap-2 rounded-[var(--r-md)] border border-dashed border-border bg-surface/60 p-6 text-sm text-muted-foreground"
        >
          <Loader2Icon aria-hidden className="size-4 animate-spin" />
          Carregando configuração vigente do modelo…
        </output>
      ) : anyError || !baseline || !draft || !simulation ? (
        <ErrorNotice
          onRetry={() => {
            configQuery.refetch();
            scoresQuery.refetch();
            historyQuery.refetch();
            taxpayersQuery.refetch();
          }}
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <RiskModelForm draft={draft} baseline={baseline} onDraftChange={setDraft} />
            <div className="grid gap-5">
              <RiskModelPreview
                summary={simulation}
                taxpayerById={taxpayerById}
                hasDraftChanges={hasDraftChanges}
              />
              <PublishBar
                bandsValid={bandsValid}
                hasDraftChanges={hasDraftChanges}
                fieldsChanged={fieldsChanged}
                onOpenPublish={() => {
                  setPublishError(null);
                  setPublishOpen(true);
                }}
              />
            </div>
          </div>

          <RiskModelHistory history={historyQuery.data ?? []} />
        </>
      )}

      {baseline && draft && simulation ? (
        <PublishConfirmDialog
          open={publishOpen}
          onOpenChange={(next) => {
            if (!publish.isPending) {
              setPublishOpen(next);
              if (!next) setPublishError(null);
            }
          }}
          onConfirm={(justification) => publish.mutate(justification)}
          isPublishing={publish.isPending}
          fieldsChanged={fieldsChanged}
          fieldsLabels={labelFieldsChanged(fieldsChanged)}
          summary={simulation}
          actorName={user?.displayName ?? "Gestor"}
          actorRoleLabel={role ? ROLE_LABEL_PT[role] : ""}
          errorMessage={publishError}
        />
      ) : null}
    </div>
  );
}

function PublishBar({
  bandsValid,
  hasDraftChanges,
  fieldsChanged,
  onOpenPublish,
}: {
  bandsValid: boolean;
  hasDraftChanges: boolean;
  fieldsChanged: readonly string[];
  onOpenPublish: () => void;
}) {
  const canPublish = bandsValid && hasDraftChanges;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-lg)] border border-border bg-surface p-4 shadow-[var(--e-1)]">
      <div className="flex items-start gap-3">
        {canPublish ? (
          <CheckCircle2Icon
            aria-hidden="true"
            className="mt-0.5 size-5 text-[color:var(--c-risk-1-txt)]"
          />
        ) : !bandsValid ? (
          <AlertTriangleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 text-[color:var(--c-risk-4-txt)]"
          />
        ) : (
          <SlidersHorizontalIcon aria-hidden="true" className="mt-0.5 size-5 text-text-muted" />
        )}
        <div className="grid gap-0.5">
          <p className="text-[13px] font-semibold text-text-strong">
            {canPublish
              ? `Pronto para publicar · ${fieldsChanged.length} alteração(ões)`
              : !bandsValid
                ? "Ajuste as faixas — precisa ser 0 < baixo < médio < alto < crítico"
                : "Nenhuma alteração no rascunho"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {canPublish
              ? "A publicação abre um diálogo de confirmação para registrar a justificativa."
              : !bandsValid
                ? "As faixas do rascunho não estão ordenadas — corrija antes de publicar."
                : "Ajuste um peso, faixa ou regra para habilitar a publicação."}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="default"
        onClick={onOpenPublish}
        disabled={!canPublish}
        aria-label="Publicar nova versão do modelo de risco"
      >
        Publicar modelo
      </Button>
    </div>
  );
}

function ForbiddenNotice({ roleLabel }: { roleLabel: string }) {
  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title="Área restrita a Gestor e Administrador"
      description={`O perfil atual (${roleLabel}) não tem permissão para configurar o modelo de risco. Solicite acesso ao Gestor responsável.`}
    />
  );
}

function ErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-[var(--r-md)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-5" />
        <div className="grid gap-1">
          <p className="font-semibold">Não foi possível carregar a configuração do modelo.</p>
          <p className="text-xs">
            Verifique sua conexão com a API mock e tente novamente. Nenhum dado foi alterado.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
