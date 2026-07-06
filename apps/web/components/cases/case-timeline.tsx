import {
  CalendarPlusIcon,
  FileTextIcon,
  GavelIcon,
  MessageSquareReplyIcon,
  StickyNoteIcon,
  UserRoundCheckIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  CaseAnnotation,
  CaseDecision,
  CaseDocument,
  Caso,
  CitizenInteracao,
} from "@fiscalcheck/shared-types";

/*
  Linha do tempo vertical do caso (T14 · RF04).
  Funde 5 fontes num único eixo cronológico (mais recente primeiro):
  criação do caso, decisões do auditor, documentos emitidos, anotações
  e devolutivas eletrônicas do contribuinte — sempre com autoria e
  timestamp (aceite).
*/

type TimelineEvent = {
  id: string;
  quando: string;
  autor: string;
  titulo: string;
  descricao?: string;
  icone: LucideIcon;
  /** Cor do marcador — devolutivas ganham destaque âmbar. */
  accent: "brand" | "amber" | "neutral";
};

const DECISION_LABEL: Record<CaseDecision["action"], string> = {
  aprovar: "Aprovou a recomendação",
  ajustar: "Ajustou o caso",
  rejeitar: "Rejeitou a recomendação",
};

const INTERACAO_LABEL: Record<CitizenInteracao["tipo"], string> = {
  ciencia: "Registrou ciência da notificação",
  adesao_parcelamento: "Aderiu ao parcelamento",
  guia_emitida: "Emitiu guia de regularização",
  contestacao: "Enviou contestação",
  agendamento: "Agendou atendimento",
};

const DOCUMENT_LABEL: Record<CaseDocument["kind"], string> = {
  termo_intimacao: "Termo de Intimação emitido",
  termo_inicio_fiscalizacao: "Termo de Início de Fiscalização emitido",
};

export function buildCaseTimeline(
  caso: Caso,
  decisions: CaseDecision[],
  documents: CaseDocument[],
  interacoes: CitizenInteracao[],
  annotations: CaseAnnotation[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `create-${caso.id}`,
      quando: caso.criadoEm,
      autor: caso.agenteResponsavel ? "Agente Orquestrador" : "Sistema",
      titulo: "Caso aberto na fila de triagem",
      icone: CalendarPlusIcon,
      accent: "neutral",
    },
  ];

  for (const d of decisions) {
    events.push({
      id: d.id,
      quando: d.timestamp,
      autor: d.atorNome,
      titulo: DECISION_LABEL[d.action],
      descricao: d.justificativa,
      icone: GavelIcon,
      accent: "brand",
    });
  }

  for (const doc of documents) {
    events.push({
      id: doc.id,
      quando: doc.emitidoEm,
      autor: "Sistema",
      titulo: `${DOCUMENT_LABEL[doc.kind]} (${doc.numero})`,
      icone: FileTextIcon,
      accent: "neutral",
    });
  }

  for (const i of interacoes) {
    events.push({
      id: i.id,
      quando: i.criadoEm,
      autor: "Contribuinte",
      titulo: `${INTERACAO_LABEL[i.tipo]} · ${i.protocolo}`,
      descricao: i.resumo,
      icone: MessageSquareReplyIcon,
      accent: "amber",
    });
    if (i.tratamento) {
      const ACAO: Record<NonNullable<CitizenInteracao["tratamento"]>["acao"], string> = {
        acatar: "Acatou a devolutiva",
        manter: "Manteve a divergência",
        solicitar_complemento: "Solicitou complemento ao contribuinte",
      };
      events.push({
        id: `${i.id}-tratamento`,
        quando: i.tratamento.tratadoEm,
        autor: i.tratamento.tratadoPorNome,
        titulo: `${ACAO[i.tratamento.acao]} · ${i.protocolo}`,
        descricao: i.tratamento.justificativa,
        icone: UserRoundCheckIcon,
        accent: "brand",
      });
    }
  }

  for (const a of annotations) {
    events.push({
      id: a.id,
      quando: a.criadoEm,
      autor: a.autorNome,
      titulo: "Anotou o caso",
      descricao: a.texto,
      icone: StickyNoteIcon,
      accent: "neutral",
    });
  }

  return events.sort((a, b) => (a.quando < b.quando ? 1 : -1));
}

const ACCENT_CLASS: Record<TimelineEvent["accent"], string> = {
  brand: "border-brand bg-brand-050 text-brand",
  amber:
    "border-[color:var(--c-risk-3)] bg-[color-mix(in_srgb,var(--c-risk-3)_14%,var(--surface))] text-[color:var(--c-risk-3-txt)]",
  neutral: "border-border bg-n-25 text-muted-foreground",
};

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">Ainda não há eventos neste caso.</p>;
  }
  return (
    <ol className="relative flex flex-col gap-4 pl-1" aria-label="Linha do tempo do caso">
      {events.map((event, index) => {
        const Icon = event.icone;
        return (
          <li key={event.id} className="relative flex gap-3">
            {index < events.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[13px] top-8 h-[calc(100%-16px)] w-px bg-border"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${ACCENT_CLASS[event.accent]}`}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold text-text-strong">
                {event.autor}
                <span className="font-normal text-foreground"> — {event.titulo}</span>
              </p>
              {event.descricao ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {event.descricao}
                </p>
              ) : null}
              <time
                dateTime={event.quando}
                className="mt-0.5 block font-data text-[11px] text-muted-foreground"
              >
                {new Date(event.quando).toLocaleString("pt-BR")}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
