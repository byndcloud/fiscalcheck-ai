"use client";

import { DownloadIcon, SearchIcon } from "lucide-react";

import type { AuditLogResult, Role } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/*
  Toolbar da trilha (T19 · módulo 6).

  Filtros no cliente + export CSV/JSON. Export chama de volta o
  pai (que já tem acesso aos eventos filtrados) e o pai é quem faz o
  download + o POST para registrar o export na própria trilha.
*/

export type AuditFilters = {
  q: string;
  role: Role | "todos";
  result: AuditLogResult | "todos";
  atypicalOnly: boolean;
  from: string;
  to: string;
};

export const AUDIT_FILTERS_DEFAULT: AuditFilters = {
  q: "",
  role: "todos",
  result: "todos",
  atypicalOnly: false,
  from: "",
  to: "",
};

const ROLE_OPTIONS: { value: AuditFilters["role"]; label: string }[] = [
  { value: "todos", label: "Todos os papéis" },
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Gestor" },
  { value: "auditor", label: "Auditor" },
  { value: "cidadao", label: "Cidadão" },
  { value: "agente_sistema", label: "Agente do sistema" },
];

const RESULT_OPTIONS: { value: AuditFilters["result"]; label: string }[] = [
  { value: "todos", label: "Todos os resultados" },
  { value: "sucesso", label: "Sucesso" },
  { value: "negado", label: "Negado" },
  { value: "erro", label: "Erro" },
];

type Props = {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
  total: number;
  onExport: (format: "csv" | "json") => void;
  isExporting: boolean;
};

export function AuditLogToolbar({ filters, onChange, total, onExport, isExporting }: Props) {
  const set = <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-3 rounded-[var(--r-lg)] border border-border bg-surface p-3 shadow-[var(--e-1)]">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_auto]">
        <div className="grid gap-1.5">
          <Label htmlFor="audit-q">Busca livre</Label>
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="audit-q"
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Ator, ação, recurso, correlation id…"
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="audit-role">Papel</Label>
          <Select
            value={filters.role}
            onValueChange={(v) => set("role", v as AuditFilters["role"])}
          >
            <SelectTrigger id="audit-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="audit-result">Resultado</Label>
          <Select
            value={filters.result}
            onValueChange={(v) => set("result", v as AuditFilters["result"])}
          >
            <SelectTrigger id="audit-result">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESULT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="default" disabled={isExporting}>
                <DownloadIcon aria-hidden="true" className="size-4" />
                {isExporting ? "Exportando…" : `Exportar (${total})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Formato
              </p>
              <div className="grid gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => onExport("csv")}
                  disabled={isExporting}
                >
                  CSV
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => onExport("json")}
                  disabled={isExporting}
                >
                  JSON
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
        <div className="grid gap-1.5">
          <Label htmlFor="audit-from">De</Label>
          <Input
            id="audit-from"
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="audit-to">Até</Label>
          <Input
            id="audit-to"
            type="date"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <Switch
            id="audit-atypical-only"
            checked={filters.atypicalOnly}
            onCheckedChange={(v) => set("atypicalOnly", v)}
          />
          <Label htmlFor="audit-atypical-only" className="text-[13px] text-text-strong">
            Só atípicos
          </Label>
        </div>
      </div>
    </div>
  );
}
