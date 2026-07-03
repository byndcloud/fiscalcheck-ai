"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, InboxIcon, Loader2Icon, SendIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  CanalComunicacao,
  Comunicacao,
  Contribuinte,
  StatusComunicacao,
} from "@fiscalcheck/shared-types";

import { CHANNEL_LABEL } from "@/components/communications/channel-icon";
import { CommunicationDetailSheet } from "@/components/communications/communication-detail-sheet";
import { CommunicationsList } from "@/components/communications/communications-list";
import { CommunicationsToolbar } from "@/components/communications/communications-toolbar";
import { STATUS_LABEL_PT } from "@/components/communications/status-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";

type CanalFilter = CanalComunicacao | "todos";
type StatusFilter = StatusComunicacao | "todos";

/*
  Página /comunicacoes (T15 · módulo 4).

  Central interna de comunicações eletrônicas. Estados vazio/carregando/
  erro tratados explicitamente. Filtros por canal e status combinam com
  busca livre em protocolo, caso, contribuinte e assunto — tudo em
  memória (fixture MSW).

  Drill-in em Sheet lateral com stepper "full", preview multicanal e
  registro probatório imutável.
*/

export default function ComunicacoesPage() {
  const query = useQuery({
    queryKey: ["communications"],
    queryFn: () => apiRequest<Comunicacao[]>("/communications"),
  });

  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    staleTime: 5 * 60 * 1000,
  });

  const [search, setSearch] = useState("");
  const [canal, setCanal] = useState<CanalFilter>("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const comunicacoes = useMemo(() => query.data ?? [], [query.data]);
  const taxpayerById = useMemo(() => {
    const map = new Map<string, Contribuinte>();
    for (const t of taxpayers.data ?? []) map.set(t.id, t);
    return map;
  }, [taxpayers.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return comunicacoes.filter((c) => {
      if (canal !== "todos" && c.canal !== canal) return false;
      if (status !== "todos" && c.status !== status) return false;
      if (!q) return true;
      const tp = taxpayerById.get(c.contribuinteId);
      const haystack = [
        c.id,
        c.protocolo,
        c.casoId,
        c.contribuinteId,
        c.assunto,
        c.conteudoResumo,
        c.canal,
        CHANNEL_LABEL[c.canal],
        c.status,
        STATUS_LABEL_PT[c.status],
        tp?.razaoSocial ?? "",
        tp?.nomeFantasia ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [comunicacoes, canal, status, search, taxpayerById]);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Central de Comunicações Eletrônicas"
        description="Rastreio ponta-a-ponta de cada notificação enviada ao contribuinte — canal, status, protocolo, prazo e registro probatório. Módulo 4."
      />

      <CommunicationsToolbar
        search={search}
        onSearchChange={setSearch}
        canal={canal}
        onCanalChange={setCanal}
        status={status}
        onStatusChange={setStatus}
        visibleCount={filtered.length}
        totalCount={comunicacoes.length}
      />

      {query.isLoading ? (
        <output
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface/60 p-6 text-sm text-muted-foreground"
        >
          <Loader2Icon aria-hidden className="size-4 animate-spin" />
          Carregando comunicações eletrônicas…
        </output>
      ) : query.isError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangleIcon aria-hidden className="mt-0.5 size-5" />
          <div className="grid gap-1">
            <p className="font-semibold">Não foi possível carregar as comunicações.</p>
            <p className="text-xs">
              Verifique sua conexão com a API mock e tente recarregar a página.
            </p>
          </div>
        </div>
      ) : comunicacoes.length === 0 ? (
        <EmptyState
          icon={SendIcon}
          title="Ainda não há comunicações eletrônicas"
          description="Comunicações emitidas pelo fluxo de casos aparecerão aqui com rastreio de entrega, ciência e resposta."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Nenhuma comunicação corresponde aos filtros"
          description="Ajuste canal, status ou o texto da busca para ver comunicações desta central."
        />
      ) : (
        <CommunicationsList data={filtered} taxpayerById={taxpayerById} onSelect={setSelectedId} />
      )}

      <CommunicationDetailSheet
        comunicacaoId={selectedId}
        fallback={comunicacoes}
        taxpayerById={taxpayerById}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
