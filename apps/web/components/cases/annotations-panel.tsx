"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNoteIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { CaseAnnotation } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api-client";
import { useSession } from "@/stores/session-store";

/*
  Anotações do auditor (T14 · RF04) — trilha append-only: uma vez
  registrada, a anotação não é editada nem removida (mesmo contrato das
  decisões do módulo 4).
*/

type Props = {
  casoId: string;
  annotations: CaseAnnotation[];
  isLoading: boolean;
};

export function AnnotationsPanel({ casoId, annotations, isLoading }: Props) {
  const queryClient = useQueryClient();
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const [texto, setTexto] = useState("");

  const criar = useMutation({
    mutationFn: (novoTexto: string) =>
      apiRequest<CaseAnnotation>(`/cases/${casoId}/annotations`, {
        method: "POST",
        body: { texto: novoTexto },
        headers: {
          "X-Actor-Role": role ?? "auditor",
          "X-Actor-Id": user?.id ?? `mock-${role ?? "auditor"}`,
          "X-Actor-Name": user?.displayName ?? "Auditor Fiscal",
        },
      }),
    onSuccess: () => {
      toast.success("Anotação registrada no caso.");
      setTexto("");
      queryClient.invalidateQueries({ queryKey: ["cases", casoId, "annotations"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao registrar a anotação.");
    },
  });

  return (
    <section
      className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
      aria-label="Anotações do auditor"
    >
      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <StickyNoteIcon aria-hidden className="size-3.5" /> Anotações do auditor
      </h4>

      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim().length >= 5) criar.mutate(texto.trim());
        }}
      >
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Registrar observação de instrução — ficará permanente na trilha do caso…"
          rows={3}
          aria-label="Nova anotação"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={texto.trim().length < 5 || criar.isPending}>
            {criar.isPending ? "Registrando…" : "Adicionar anotação"}
          </Button>
        </div>
      </form>

      <div className="mt-3 border-t border-border pt-3">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando anotações…</p>
        ) : annotations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma anotação registrada para este caso.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {annotations.map((nota) => (
              <li key={nota.id} className="rounded-[var(--r-md)] border border-border bg-n-25 p-3">
                <p className="text-xs leading-relaxed text-foreground">{nota.texto}</p>
                <p className="mt-1.5 font-data text-[11px] text-muted-foreground">
                  {nota.autorNome} · {new Date(nota.criadoEm).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
