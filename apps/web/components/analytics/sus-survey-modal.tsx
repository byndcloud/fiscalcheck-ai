"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, StarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { SusSubmitResponse } from "@fiscalcheck/shared-types";

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
import { SUS_ESCALA_LABELS, SUS_QUESTOES_PT_BR, computeSusScore } from "@/lib/analytics/sus";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Modal do questionário SUS (T17 · Painel do Gestor).
  10 perguntas Likert 1..5 traduzidas ao pt-BR. Calcula o score no
  cliente (função pura testada em unit) e envia ao MSW, que atualiza
  a meta de usabilidade e reemite alerta se aplicável.
*/

type SusSurveyModalProps = {
  metaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function initialAnswers(): number[] {
  return Array.from({ length: 10 }, () => 3);
}

export function SusSurveyModal({ metaId, open, onOpenChange }: SusSurveyModalProps) {
  const queryClient = useQueryClient();
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const [respostas, setRespostas] = useState<number[]>(initialAnswers);
  const [comentario, setComentario] = useState("");

  const scorePreview = useMemo(() => {
    try {
      return computeSusScore(respostas);
    } catch {
      return 0;
    }
  }, [respostas]);

  const mutation = useMutation<SusSubmitResponse, Error, void>({
    mutationFn: () =>
      apiRequest<SusSubmitResponse>(`/analytics/metas/${metaId}/sus`, {
        method: "POST",
        body: {
          respostas,
          comentario: comentario.trim() || undefined,
        },
        headers: {
          "X-Actor-Role": role ?? "auditor",
          "X-Actor-Id": user?.id ?? "mock-anon",
          "X-Actor-Name": user?.displayName ?? "Auditor",
        },
      }),
    onSuccess: (data) => {
      toast.success("Avaliação SUS registrada", {
        description: `Score ${data.avaliacao.score} · nova média da meta: ${data.novaMetaAtual}`,
      });
      queryClient.invalidateQueries({ queryKey: ["analytics", "metas"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "sus"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setRespostas(initialAnswers());
      setComentario("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Não foi possível registrar a avaliação", {
        description: error.message,
      });
    },
  });

  const setResposta = (idx: number, value: number) => {
    setRespostas((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Questionário de Usabilidade (SUS)</DialogTitle>
          <DialogDescription>
            10 afirmações em escala 1 (Discordo totalmente) a 5 (Concordo totalmente). Sua nota
            alimenta a meta de usabilidade do piloto.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="grid gap-4">
          <legend className="sr-only">Perguntas do SUS</legend>
          {SUS_QUESTOES_PT_BR.map((pergunta, idx) => {
            const currentValue = respostas[idx] ?? 3;
            return (
              <div key={pergunta} className="grid gap-2">
                <p className="text-sm text-[#121826]">
                  <span className="mr-1 font-semibold text-[#54607a]">{idx + 1}.</span>
                  {pergunta}
                </p>
                <div
                  role="radiogroup"
                  aria-label={`Pergunta ${idx + 1}: ${pergunta}`}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map((option) => {
                    const selected = option === currentValue;
                    return (
                      <button
                        key={option}
                        type="button"
                        // biome-ignore lint/a11y/useSemanticElements: chip customizado do DS (fundo/borda por estado). Semântica preservada por role="radio" + aria-checked + role="radiogroup" no pai.
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setResposta(idx, option)}
                        className={cn(
                          "min-w-[64px] rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2",
                          selected
                            ? "border-transparent bg-[#1351b4] text-white shadow-[0_1px_2px_rgba(19,81,180,0.25)]"
                            : "border-[#e1e6f0] bg-white text-[#54607a] hover:bg-[#f4f6fb]",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#66718a]">{SUS_ESCALA_LABELS[currentValue - 1]}</p>
              </div>
            );
          })}
        </fieldset>

        <div className="grid gap-2">
          <label htmlFor="sus-comentario" className="text-[13px] font-semibold text-[#121826]">
            Comentário opcional
          </label>
          <textarea
            id="sus-comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="O que ficou mais confuso ou mais fluido? (máx. 500 caracteres)"
            className="rounded-lg border border-[#e1e6f0] bg-white p-3 text-sm text-[#121826] placeholder:text-[#a0a9bd] focus:border-[#1351b4] focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-1"
          />
        </div>

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#54607a]">
            <StarIcon aria-hidden="true" className="size-4 text-[#f2a900]" />
            <span>
              Prévia do score:{" "}
              <strong className="font-semibold text-[#121826]">{scorePreview}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2Icon aria-hidden="true" className="mr-2 size-4 animate-spin" />
              ) : null}
              Enviar avaliação
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
