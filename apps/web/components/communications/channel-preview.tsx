import {
  Building2Icon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "lucide-react";

import type { Comunicacao } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Preview visual de como a comunicação chega em cada canal (T15).

  Não é WYSIWYG do template real — é uma representação didática para o
  auditor ver a "cara" do que o contribuinte recebeu. Estilos derivam do
  DS (nenhum hex avulso além do "verde WhatsApp" #25D366, permitido só
  como marca cultural do canal).
*/

type Props = {
  comunicacao: Comunicacao;
  className?: string;
};

function truncate(text: string, max = 180): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function ChannelPreview({ comunicacao, className }: Props) {
  const { canal, assunto, conteudoResumo, destinatario, protocolo } = comunicacao;

  if (canal === "portal") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border shadow-[var(--e-1)]",
          className,
        )}
      >
        <div className="flex items-center gap-2 bg-[linear-gradient(180deg,#071d41_0%,#0a2552_100%)] px-4 py-2 text-white">
          <Building2Icon aria-hidden className="size-4 text-[#19d3e8]" />
          <span className="text-xs font-semibold">Portal do Contribuinte · Brusque/SC</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-[#7e97c4]">
            {protocolo}
          </span>
        </div>
        <div className="flex flex-col gap-3 bg-surface p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GlobeIcon aria-hidden className="size-3.5 text-brand" />
            <span>Nova comunicação eletrônica disponível</span>
          </div>
          <h4 className="text-sm font-semibold text-text-strong">{assunto}</h4>
          <p className="text-sm text-foreground">{truncate(conteudoResumo, 240)}</p>
          <div className="flex items-center gap-1.5 rounded-md bg-brand-050 px-3 py-2 text-xs text-brand-deep">
            <ShieldCheckIcon aria-hidden className="size-3.5" />
            Ciência com valor probatório será registrada ao clicar em <b>Confirmar</b>.
          </div>
        </div>
      </div>
    );
  }

  if (canal === "email") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--e-1)]",
          className,
        )}
      >
        <div className="flex items-center gap-2 border-b border-border bg-n-25 px-4 py-2">
          <MailIcon aria-hidden className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Inbox · Outlook Web</span>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <div className="grid grid-cols-[64px_1fr] gap-x-3 text-xs">
            <span className="text-muted-foreground">De</span>
            <span className="font-medium text-foreground">
              SEFAZ Brusque &lt;nao-responda@brusque.sc.gov.br&gt;
            </span>
            <span className="text-muted-foreground">Para</span>
            <span className="text-foreground">
              {destinatario.nome} &lt;{destinatario.email ?? "sem-email@—"}&gt;
            </span>
            <span className="text-muted-foreground">Assunto</span>
            <span className="font-semibold text-text-strong">{assunto}</span>
          </div>
          <div className="mt-3 rounded-md border border-border bg-n-25/60 p-3 text-sm leading-relaxed text-foreground">
            <p className="mb-2">Prezado(a) contribuinte,</p>
            <p>{truncate(conteudoResumo, 300)}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Protocolo: <span className="font-mono text-text-strong">{protocolo}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (canal === "sms") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[280px] rounded-2xl border border-border bg-n-25 p-3 shadow-[var(--e-1)]",
          className,
        )}
      >
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <PhoneIcon aria-hidden className="size-3" /> SMS
          </span>
          <span>SEFAZ Brusque</span>
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-xs leading-relaxed text-foreground shadow-inner">
          <p className="mb-1 font-semibold text-text-strong">SEFAZ Brusque</p>
          <p>{truncate(conteudoResumo, 160)}</p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">{protocolo}</p>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Para: {destinatario.telefoneMascarado ?? "—"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-[320px] rounded-2xl border border-border bg-[#e5ddd5] p-3 shadow-[var(--e-1)]",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-[#25D366] text-white"
        >
          <MessageCircleIcon className="size-3.5" />
        </span>
        <div className="grid leading-tight">
          <span className="text-xs font-semibold text-text-strong">SEFAZ Brusque</span>
          <span className="text-[10px] text-muted-foreground">Business API · verified</span>
        </div>
      </div>
      <div className="ml-2 max-w-[calc(100%-8px)] rounded-lg rounded-tl-none bg-surface p-3 text-xs leading-relaxed text-foreground shadow-[var(--e-1)]">
        <p className="mb-1 font-semibold text-text-strong">{assunto}</p>
        <p>{truncate(conteudoResumo, 220)}</p>
        <p className="mt-2 flex items-center justify-end gap-1 font-mono text-[10px] text-muted-foreground">
          {protocolo}
        </p>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Para: {destinatario.telefoneMascarado ?? "—"}
      </p>
    </div>
  );
}
