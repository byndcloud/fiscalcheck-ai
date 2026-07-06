"use client";

import { useQuery } from "@tanstack/react-query";
import { LockIcon, SendIcon, SparklesIcon, UserIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Caso, Contribuinte, CopilotMessage } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCopilotChat } from "@/hooks/use-copilot-chat";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useCopilotStore } from "@/stores/copilot-store";

/*
  Copilot Fiscal (T18 — RF10/FA11, módulo 6). Chat lateral com bolhas,
  chips de fontes e sugestões de pergunta. Histórico só em memória (não
  persiste entre reloads — front-end mock, sem backend real).

  Contexto do Dossiê (chip "Contexto: CS-..."): reaproveita as MESMAS
  queryKeys ["cases"]/["taxpayers"] já usadas por /cases e pelo
  CaseDossieSheet, então não dispara fetch extra quando o cache já
  estiver quente.
*/

const SUGESTOES_INICIAIS = [
  "Qual a alíquota do ISS?",
  "Como o score de risco é calculado?",
  "Como funciona a autorregularização?",
  "Quais os prazos de intimação?",
];

let localMessageSeq = 0;
function nextLocalMessageId(): string {
  localMessageSeq += 1;
  return `cpm-local-${localMessageSeq}`;
}

export function CopilotPanel() {
  const open = useCopilotStore((s) => s.open);
  const contextoCasoId = useCopilotStore((s) => s.contextoCasoId);
  const closeCopilot = useCopilotStore((s) => s.closeCopilot);
  const clearContext = useCopilotStore((s) => s.clearContext);

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [pergunta, setPergunta] = useState("");
  const chat = useCopilotChat();

  const casos = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiRequest<Caso[]>("/cases"),
    enabled: open && contextoCasoId !== null,
  });
  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    enabled: open && contextoCasoId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const casoContexto = casos.data?.find((c) => c.id === contextoCasoId) ?? null;
  const contribuinteContexto = casoContexto
    ? taxpayers.data?.find((c) => c.id === casoContexto.contribuinteId)
    : undefined;

  function sendQuestion(texto: string) {
    const trimmed = texto.trim();
    if (!trimmed || chat.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        id: nextLocalMessageId(),
        autor: "auditor",
        texto: trimmed,
        fontes: [],
        timestamp: new Date().toISOString(),
      },
    ]);
    setPergunta("");

    chat.mutate(
      { pergunta: trimmed, contextoCasoId: contextoCasoId ?? undefined },
      {
        onSuccess: (data) => setMessages((prev) => [...prev, data.mensagem]),
        onError: () => toast.error("Não foi possível consultar o Copilot agora. Tente novamente."),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? closeCopilot() : undefined)}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-[image:var(--grad-aurora)] text-white"
            >
              <SparklesIcon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <SheetTitle>Copilot Fiscal</SheetTitle>
              <SheetDescription>Consulta em linguagem natural · não executa ações</SheetDescription>
            </div>
          </div>

          {contextoCasoId ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-n-25 px-2.5 py-1 font-mono text-[11px] uppercase text-foreground">
              Contexto: {contextoCasoId.toUpperCase()}
              {contribuinteContexto ? ` · ${contribuinteContexto.razaoSocial}` : ""}
              <button
                type="button"
                aria-label="Remover contexto do caso"
                onClick={clearContext}
                className="ml-0.5 rounded-full p-0.5 hover:bg-n-100"
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </span>
          ) : null}
        </SheetHeader>

        <div className="flex items-start gap-2 border-b border-border bg-brand-050 px-4 py-2.5 text-xs text-brand-deep">
          <LockIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <p>O Copilot consulta e fundamenta — a ação fiscal é sempre decidida pelo auditor.</p>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <EmptyState
                icon={SparklesIcon}
                title="Pergunte ao Copilot Fiscal"
                description="Legislação tributária municipal, critérios do score de risco ou o histórico de um contribuinte."
                className="border-none bg-transparent"
              />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-2",
                    message.autor === "auditor" && "flex-row-reverse",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-white",
                      message.autor === "auditor" ? "bg-primary" : "bg-[image:var(--grad-aurora)]",
                    )}
                  >
                    {message.autor === "auditor" ? (
                      <UserIcon className="size-3.5" />
                    ) : (
                      <SparklesIcon className="size-3.5" />
                    )}
                  </span>
                  <div
                    className={cn(
                      "grid max-w-[85%] gap-1.5 rounded-lg px-3 py-2 text-sm",
                      message.autor === "auditor"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-surface text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.texto}</p>
                    {message.fontes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {message.fontes.map((fonte) => (
                          <span
                            key={fonte.label}
                            className="rounded-full border border-border bg-n-25 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {fonte.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {chat.isPending ? (
              <p className="text-xs text-muted-foreground">Copilot está consultando as fontes…</p>
            ) : null}
          </div>
        </ScrollArea>

        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
          {SUGESTOES_INICIAIS.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() => sendQuestion(sugestao)}
              disabled={chat.isPending}
              className="rounded-full border border-border bg-n-25 px-2.5 py-1 text-[11px] text-foreground transition-colors hover:bg-brand-050 disabled:opacity-50"
            >
              {sugestao}
            </button>
          ))}
        </div>

        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            sendQuestion(pergunta);
          }}
        >
          <input
            value={pergunta}
            onChange={(event) => setPergunta(event.target.value)}
            placeholder="Pergunte ao Copilot Fiscal..."
            aria-label="Pergunta ao Copilot Fiscal"
            className="h-9 flex-1 rounded-full border border-input bg-surface px-3.5 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand-050"
          />
          <Button
            type="submit"
            size="icon-sm"
            aria-label="Enviar pergunta"
            disabled={chat.isPending || !pergunta.trim()}
          >
            <SendIcon aria-hidden="true" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
