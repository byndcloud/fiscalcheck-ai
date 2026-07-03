"use client";

import { SearchIcon, XIcon } from "lucide-react";

import type { CanalComunicacao, StatusComunicacao } from "@fiscalcheck/shared-types";

import { CHANNEL_LABEL } from "@/components/communications/channel-icon";
import { STATUS_LABEL_PT } from "@/components/communications/status-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/*
  Toolbar da Central de Comunicações (T15).

  - Busca livre (protocolo, contribuinte, caso, assunto).
  - Filtro por canal (portal/email/sms/whatsapp).
  - Filtro por status (enviada → respondida + falha).
  - Contador "visíveis/total" para dar sinal ao auditor.
  - Botão "Limpar filtros" quando algum filtro está ativo.
*/

type CanalFilter = CanalComunicacao | "todos";
type StatusFilter = StatusComunicacao | "todos";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  canal: CanalFilter;
  onCanalChange: (value: CanalFilter) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  visibleCount: number;
  totalCount: number;
  className?: string;
};

const CANAL_ORDER: readonly CanalComunicacao[] = ["portal", "email", "sms", "whatsapp"] as const;
const STATUS_ORDER: readonly StatusComunicacao[] = [
  "enviada",
  "entregue",
  "ciencia",
  "respondida",
  "falha",
] as const;

export function CommunicationsToolbar({
  search,
  onSearchChange,
  canal,
  onCanalChange,
  status,
  onStatusChange,
  visibleCount,
  totalCount,
  className,
}: Props) {
  const anyFilterActive = search.trim().length > 0 || canal !== "todos" || status !== "todos";

  const handleClear = () => {
    onSearchChange("");
    onCanalChange("todos");
    onStatusChange("todos");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)] md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar comunicações"
            placeholder="Buscar por protocolo, caso, contribuinte ou assunto…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="comunicacao-canal-filter"
          >
            Canal
          </label>
          <Select value={canal} onValueChange={(v) => onCanalChange(v as CanalFilter)}>
            <SelectTrigger id="comunicacao-canal-filter" size="sm" className="min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os canais</SelectItem>
              {CANAL_ORDER.map((c) => (
                <SelectItem key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="comunicacao-status-filter"
          >
            Status
          </label>
          <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
            <SelectTrigger id="comunicacao-status-filter" size="sm" className="min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL_PT[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {anyFilterActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon aria-hidden />
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <p className="whitespace-nowrap text-xs text-muted-foreground">
        <span className="font-semibold text-text-strong">{visibleCount}</span> de{" "}
        <span className="font-mono">{totalCount}</span> comunicaç{totalCount === 1 ? "ão" : "ões"}
      </p>
    </div>
  );
}
