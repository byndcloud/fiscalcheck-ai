"use client";

import type { ConnectorProtocol } from "@fiscalcheck/shared-types";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CloudIcon,
  FileJsonIcon,
  FileTextIcon,
  type LucideIcon,
  ServerIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { LgpdBadge } from "./lgpd-badge";

/*
  Assistente "Adicionar nova fonte" (mock visual). Demonstra a UX de
  conectores configuráveis sem refatorar o núcleo. Sem persistência:
  o fluxo termina com toast informando modo simulação.
*/

type WizardStep = 1 | 2 | 3;

const PROTOCOL_OPTIONS: Array<{
  id: ConnectorProtocol;
  label: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    id: "XML",
    label: "XML",
    description: "Recepção de arquivo XML por lote (ex.: NFS-e).",
    Icon: FileTextIcon,
  },
  {
    id: "JSON",
    label: "JSON",
    description: "Payload JSON via upload direto ou stream.",
    Icon: FileJsonIcon,
  },
  {
    id: "CSV",
    label: "CSV",
    description: "Planilhas tabulares (PGDAS-D, cadastro).",
    Icon: FileTextIcon,
  },
  {
    id: "API",
    label: "API REST",
    description: "Endpoint HTTPS com autenticação (OAuth2 ou API key).",
    Icon: CloudIcon,
  },
  {
    id: "SFTP",
    label: "SFTP",
    description: "Servidor SFTP com rotação de chave gerenciada.",
    Icon: ServerIcon,
  },
];

const SAMPLE_FIELDS = [
  { nome: "cnpj_estabelecimento", tipo: "string" },
  { nome: "competencia", tipo: "date (YYYY-MM)" },
  { nome: "valor_bruto", tipo: "number" },
  { nome: "cnae_principal", tipo: "string" },
];

type AddSourceWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddSourceWizard({ open, onOpenChange }: AddSourceWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [protocolo, setProtocolo] = useState<ConnectorProtocol | null>(null);
  const [nome, setNome] = useState("");
  const [mapping, setMapping] = useState(
    JSON.stringify(
      {
        cnpj_estabelecimento: "$.contribuinte.cnpj",
        competencia: "$.periodo.mesAno",
        valor_bruto: "$.totais.bruto",
      },
      null,
      2,
    ),
  );

  const protocolLabel = useMemo(
    () => PROTOCOL_OPTIONS.find((opt) => opt.id === protocolo)?.label,
    [protocolo],
  );

  const reset = () => {
    setStep(1);
    setProtocolo(null);
    setNome("");
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset após animação; timeout curto evita flicker.
      setTimeout(reset, 200);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    toast.success("Fonte cadastrada em modo simulação", {
      description:
        "O conector foi registrado no ambiente de demonstração. Nenhuma carga real foi disparada.",
    });
    handleClose(false);
  };

  const canAdvance =
    (step === 1 && protocolo !== null && nome.trim().length > 0) ||
    (step === 2 && mapping.trim().length > 0) ||
    step === 3;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:!max-w-xl">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              Passo {step} de 3
            </span>
            <LgpdBadge compact />
          </div>
          <SheetTitle>Adicionar nova fonte</SheetTitle>
          <SheetDescription>
            Configure um conector sem refatorar o núcleo (RNF04/RNF05). Este assistente é uma
            simulação — nenhuma carga real é disparada.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="new-source-name">Nome da fonte</Label>
                <Input
                  id="new-source-name"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex.: NFS-e Blumenau"
                />
              </div>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-text-strong">
                  Protocolo do conector
                </legend>
                <div className="grid gap-2">
                  {PROTOCOL_OPTIONS.map((option) => {
                    const active = protocolo === option.id;
                    const Icon = option.Icon;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        aria-pressed={active}
                        onClick={() => setProtocolo(option.id)}
                        className={cn(
                          "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
                          active
                            ? "border-brand bg-brand-050"
                            : "border-border bg-card hover:border-brand-300/60",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-8 place-items-center rounded-md",
                            active ? "bg-brand text-white" : "bg-n-25 text-brand",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="grid gap-0.5">
                          <span className="text-sm font-semibold text-text-strong">
                            {option.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                        {active ? (
                          <CheckCircle2Icon aria-hidden="true" className="size-4 text-brand" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium text-text-strong">Mapeamento de schema</p>
                <p className="text-xs text-muted-foreground">
                  Descreva o mapeamento JSONPath / XPath de cada campo do FiscalCheck AI para o
                  payload do conector <span className="font-semibold">{protocolLabel}</span>.
                </p>
              </div>
              <textarea
                aria-label="Mapeamento de schema"
                value={mapping}
                onChange={(event) => setMapping(event.target.value)}
                className={cn(
                  "min-h-48 w-full rounded-md border border-input bg-background p-3 font-mono text-xs shadow-[var(--e-1)]",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
                )}
              />
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Campos canônicos do FiscalCheck AI
                </p>
                <ul className="grid gap-1.5">
                  {SAMPLE_FIELDS.map((field) => (
                    <li
                      key={field.nome}
                      className="flex items-center justify-between rounded-md border border-border bg-n-25/40 px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono text-text-strong">{field.nome}</span>
                      <span className="rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-semibold text-brand-deep">
                        {field.tipo}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Revise a configuração antes de simular o cadastro. Ao confirmar, o conector é
                registrado somente no ambiente de demonstração.
              </p>
              <dl className="grid gap-3 rounded-lg border border-border bg-n-25/40 p-4 text-sm">
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd className="font-semibold text-text-strong">{nome || "—"}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="text-muted-foreground">Protocolo</dt>
                  <dd className="font-semibold text-text-strong">{protocolLabel ?? "—"}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="text-muted-foreground">Mapeamento</dt>
                  <dd>
                    <pre className="max-h-40 overflow-auto rounded-md bg-card p-2 font-mono text-[11px] text-text-strong">
                      {mapping}
                    </pre>
                  </dd>
                </div>
              </dl>
              <div className="rounded-md border border-[color:var(--c-aurora-to)]/40 bg-[color:var(--c-aurora-to)]/5 p-3 text-xs text-brand-deep">
                Dados de contribuintes serão pseudonimizados automaticamente antes da persistência,
                conforme política LGPD (art. 12, IV) e sigilo fiscal (art. 198, CTN).
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
              disabled={step === 1}
            >
              <ArrowLeftIcon aria-hidden="true" />
              Voltar
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s))}
                disabled={!canAdvance}
              >
                Avançar
              </Button>
            ) : (
              <Button type="button" onClick={handleConfirm}>
                Cadastrar em simulação
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
