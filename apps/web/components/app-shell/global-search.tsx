"use client";

import { Loader2Icon, SearchIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import type { SearchResult, SearchResultType } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { isAuditorRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useDossieStore } from "@/stores/dossie-store";
import { useSession } from "@/stores/session-store";

/*
  Busca global (T24 — transversal). Campo fixo na topbar (não paleta de
  comando: sem cmdk no projeto), com dropdown de resultados agrupados por
  tipo e navegação por teclado (setas + Enter). RBAC: só visível para
  perfis internos (auditor/supervisor/admin) — cidadão nunca vê o campo.

  Abaixo de `md` colapsa para um ícone que abre a mesma busca num Sheet
  full-width, para não competir por espaço com o menu mobile.
*/

const TYPE_LABEL: Record<SearchResultType, string> = {
  contribuinte: "Contribuinte",
  caso: "Caso",
  cnpj: "CNPJ/Inscrição",
};

const TYPE_ORDER: SearchResultType[] = ["caso", "contribuinte", "cnpj"];

function groupByType(results: SearchResult[]): { tipo: SearchResultType; items: SearchResult[] }[] {
  return TYPE_ORDER.map((tipo) => ({
    tipo,
    items: results.filter((r) => r.tipo === tipo),
  })).filter((group) => group.items.length > 0);
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function SearchBox({ onSelected, autoFocus }: { onSelected?: () => void; autoFocus?: boolean }) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);
  const openDossie = useDossieStore((s) => s.openDossie);

  const search = useGlobalSearch(debouncedQuery);
  const results = search.data ?? [];
  const groups = groupByType(results);
  const activeResultId = activeIndex >= 0 ? results[activeIndex]?.id : undefined;

  /*
    A navegação por teclado move o destaque via aria-activedescendant (o foco
    fica no input), então o browser não rola o dropdown sozinho — sem isto, o
    item ativo some atrás do overflow. `block: "nearest"` rola o mínimo
    necessário e é no-op para itens já visíveis (inclusive hover do mouse).
    Guarda opcional porque jsdom não implementa scrollIntoView.
  */
  useEffect(() => {
    if (!activeResultId) return;
    document.getElementById(`${listboxId}-${activeResultId}`)?.scrollIntoView?.({
      block: "nearest",
    });
  }, [activeResultId, listboxId]);

  function selectResult(result: SearchResult) {
    if (!result.casoRelacionadoId) {
      toast.info("Nenhum caso associado a este contribuinte ainda.");
      return;
    }
    openDossie(result.casoRelacionadoId);
    setQuery("");
    setDropdownOpen(false);
    setActiveIndex(-1);
    onSelected?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) selectResult(target);
    } else if (event.key === "Escape") {
      setDropdownOpen(false);
      setActiveIndex(-1);
      event.currentTarget.blur();
    }
  }

  const activeId =
    activeIndex >= 0 && results[activeIndex]
      ? `${listboxId}-${results[activeIndex].id}`
      : undefined;

  return (
    <div className="relative w-full">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={dropdownOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        aria-label="Buscar CNPJ, caso ou contribuinte"
        placeholder="Buscar CNPJ, caso ou contribuinte..."
        className="pl-9"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setDropdownOpen(true);
        }}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />

      {dropdownOpen && query.trim().length > 1 ? (
        // biome-ignore lint/a11y/useFocusableInteractive: padrão combobox WAI-ARIA — o foco permanece no input, a listbox é referenciada via aria-activedescendant.
        <div
          id={listboxId}
          // biome-ignore lint/a11y/useSemanticElements: <select> nativo não permite o layout de dropdown com ícones/badges exigido pelo DS.
          role="listbox"
          aria-label="Resultados da busca"
          className="absolute top-full left-0 z-50 mt-1 max-h-96 w-full min-w-[320px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-[var(--e-2)]"
        >
          {search.isLoading ? (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2Icon aria-hidden className="size-3.5 animate-spin" /> Buscando…
            </p>
          ) : search.isError ? (
            <p role="alert" className="px-3 py-4 text-sm text-destructive">
              Não foi possível buscar agora. Tente novamente em instantes.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Nenhum resultado para &ldquo;{query}&rdquo;.
            </p>
          ) : (
            groups.map((group) => (
              // biome-ignore lint/a11y/useSemanticElements: <fieldset> não se aplica a um grupo de opções de listbox (não é um formulário).
              <div key={group.tipo} role="group" aria-label={TYPE_LABEL[group.tipo]}>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {TYPE_LABEL[group.tipo]}
                </p>
                {group.items.map((item) => {
                  const flatIndex = results.indexOf(item);
                  const active = flatIndex === activeIndex;
                  return (
                    <button
                      key={`${item.tipo}-${item.id}`}
                      id={`${listboxId}-${item.id}`}
                      type="button"
                      // biome-ignore lint/a11y/useSemanticElements: <option> só existe dentro de <select>, incompatível com o layout rico exigido aqui.
                      role="option"
                      aria-selected={active}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectResult(item)}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        active ? "bg-brand-050" : "hover:bg-n-25",
                      )}
                    >
                      <span className="grid min-w-0 gap-0.5">
                        <span className="truncate font-medium text-text-strong">{item.titulo}</span>
                        {item.subtitulo ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {item.subtitulo}
                          </span>
                        ) : null}
                      </span>
                      {item.status ? (
                        <StatusBadge kind="status" status={item.status} />
                      ) : item.nivelRisco ? (
                        <StatusBadge kind="risk" level={item.nivelRisco} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function GlobalSearch() {
  const role = useSession((s) => s.role);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuditorRole(role)) return null;

  return (
    <>
      <div className="hidden max-w-md flex-1 md:block">
        <SearchBox />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Buscar CNPJ, caso ou contribuinte"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <SearchIcon aria-hidden="true" />
      </Button>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="top" className="p-4">
          <SheetTitle className="sr-only">Busca global</SheetTitle>
          <SearchBox autoFocus onSelected={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
