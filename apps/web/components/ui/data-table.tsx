"use client";

import {
  type ColumnDef,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — DataTable.
  Camada fina sobre @tanstack/react-table com estilos DS:
   - cabeçalho tipográfico --font-ui, dados em --font-data quando numérico
   - focos e hovers via tokens brand
   - busca global opcional (props.searchable)

  Responsividade: colunas secundárias podem declarar
  `meta: { className: "hidden lg:table-cell" }` para sair do fluxo em
  telas estreitas — a tabela deve caber na largura disponível sem gerar
  scroll horizontal (conteúdo excedente cresce na vertical).
*/

declare module "@tanstack/react-table" {
  // A assinatura genérica é exigida pelo declaration merging do TanStack.
  // biome-ignore lint/correctness/noUnusedVariables: merge de tipos exige os dois genéricos
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Classes aplicadas ao <th> e ao <td> da coluna (ex.: esconder em telas estreitas). */
    className?: string;
  }
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

function DataTable<TData, TValue>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "Filtrar…",
  emptyMessage = "Nenhum resultado.",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div data-slot="data-table" className={cn("flex flex-col gap-3", className)}>
      {searchable ? (
        <div className="flex items-center gap-2">
          <Input
            aria-label="Filtro global"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
      ) : null}

      {/* overflow-x-auto é só o último recurso: as colunas usam meta.className
          para sair do fluxo em telas estreitas e o conteúdo quebra na vertical. */}
      <div className="overflow-x-auto rounded-md border border-border bg-surface shadow-[var(--e-1)]">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-n-25 text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "h-10 px-3 text-left align-middle font-medium",
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-sm px-1 -mx-1 py-0.5 transition-colors hover:text-brand",
                            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === "asc" ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : sortDir === "desc" ? (
                            <ArrowDownIcon className="size-3.5" />
                          ) : (
                            <ArrowUpDownIcon className="size-3.5 opacity-60" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors hover:bg-brand-050/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-3 py-3 align-middle text-foreground",
                        cell.column.columnDef.meta?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
export type { DataTableProps };
