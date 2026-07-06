"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { TrainingCase } from "@fiscalcheck/shared-types";

import { TrainingBanner } from "@/components/training/training-banner";
import { TrainingCaseCard } from "@/components/training/training-case-card";
import { TrainingCaseSheet } from "@/components/training/training-case-sheet";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

/*
  Ambiente de Simulação e Capacitação (T20 · RSC04 · módulo 6).

  Modo "Treinamento" para novos auditores: biblioteca de casos-exercício
  100% anonimizados (codinome + CNPJ mascarado), sem NENHUMA mistura com
  o ambiente real — handlers, estado e rota são exclusivos do treino.
*/

export default function TreinamentoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const query = useQuery({
    queryKey: ["training", "cases"],
    queryFn: () => apiRequest<TrainingCase[]>("/training/cases"),
  });

  const exercises = query.data ?? [];
  const concluidos = exercises.filter((e) => e.tentativa).length;
  const acertos = exercises.filter((e) => e.tentativa?.acertou).length;
  const progressoPct = exercises.length > 0 ? Math.round((concluidos / exercises.length) * 100) : 0;

  const selectedExercise = exercises.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="grid gap-6">
      <TrainingBanner />

      <PageHeader
        title="Ambiente de treinamento"
        description="Casos-exercício baseados em decisões históricas da fiscalização, com contribuintes anonimizados. Decida como faria num caso real e compare com o gabarito do auditor experiente."
      />

      {exercises.length > 0 ? (
        <section
          aria-label="Progresso do treinamento"
          className="grid gap-2 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-text-strong">
              {concluidos} de {exercises.length} exercícios concluídos
            </p>
            <p className="text-xs text-muted-foreground">
              {concluidos > 0
                ? `${acertos} ${acertos === 1 ? "decisão alinhada" : "decisões alinhadas"} ao gabarito`
                : "Comece pelos exercícios de nível iniciante"}
            </p>
          </div>
          <Progress value={progressoPct} aria-label={`Progresso: ${progressoPct}%`} />
        </section>
      ) : null}

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={exercises.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard height="h-44" />
            <SkeletonCard height="h-44" />
            <SkeletonCard height="h-44" />
          </div>
        }
        empty={
          <EmptyState
            title="Nenhum exercício disponível"
            description="A biblioteca de casos-exercício ainda não foi carregada neste ambiente."
          />
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <li key={exercise.id} className="grid">
              <TrainingCaseCard
                exercise={exercise}
                onOpen={(id) => {
                  setSelectedId(id);
                  setSheetOpen(true);
                }}
              />
            </li>
          ))}
        </ul>
      </AsyncBoundary>

      <TrainingCaseSheet exercise={selectedExercise} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
