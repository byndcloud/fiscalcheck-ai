"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  CreditCardIcon,
  FileTextIcon,
  InboxIcon,
  LandmarkIcon,
  type LucideIcon,
  PlugZapIcon,
  UploadIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { ImportFileDialog } from "@/components/ingestion/import-file-dialog";
import { NewIntegrationDialog } from "@/components/ingestion/new-integration-dialog";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";
import type { ArquivoIngerido, IntegracaoFonte } from "@/mocks/fixtures/arquivos";
import { useSession } from "@/stores/session-store";

const STATUS_LABEL: Record<ArquivoIngerido["status"], string> = {
  recebido: "Recebido",
  validando: "Validando",
  processado: "Processado",
  com_erro: "Com erro",
  quarentena: "Quarentena",
};

/*
  Catálogo das fontes oficiais do módulo 1 (RF 3.1.1 do TR): mesmo que
  nenhum arquivo de uma fonte tenha chegado nas últimas 24h, o card
  aparece como "Aguardando carga" — a grade representa o conector, não
  o arquivo. Integrações criadas pelo Admin entram na mesma grade.
*/
const FONTES: {
  fonte: ArquivoIngerido["fonte"];
  label: string;
  descricao: string;
  icon: LucideIcon;
}[] = [
  {
    fonte: "NFSe",
    label: "NFS-e",
    descricao: "Notas fiscais de serviço",
    icon: FileTextIcon,
  },
  {
    fonte: "PGDAS",
    label: "PGDAS-D",
    descricao: "Declaração mensal do Simples",
    icon: LandmarkIcon,
  },
  {
    fonte: "DIMP",
    label: "DIMP",
    descricao: "Meios de pagamento (cartões)",
    icon: CreditCardIcon,
  },
  {
    fonte: "DEFIS",
    label: "DEFIS",
    descricao: "Declaração anual do Simples",
    icon: ClipboardListIcon,
  },
  {
    fonte: "ECD",
    label: "ECD",
    descricao: "Escrituração contábil digital",
    icon: CalendarClockIcon,
  },
  {
    fonte: "Cadastro",
    label: "Cadastro Mobiliário",
    descricao: "Base cadastral de contribuintes",
    icon: Building2Icon,
  },
];

const INTEGRACAO_TIPO_LABEL: Record<IntegracaoFonte["tipo"], string> = {
  api: "API REST",
  sftp: "SFTP",
  upload_manual: "Upload manual",
};

const INTEGRACAO_PERIODICIDADE_LABEL: Record<IntegracaoFonte["periodicidade"], string> = {
  tempo_real: "tempo real",
  diaria: "diária",
  semanal: "semanal",
  mensal: "mensal",
};

type FonteResumo = {
  ultimoStatus: ArquivoIngerido["status"] | null;
  ultimaCarga: string | null;
  linhas: number;
  erros: number;
  arquivos: number;
};

const STATUS_TONE: Record<ArquivoIngerido["status"], "risk-1" | "risk-3" | "risk-4" | "info"> = {
  processado: "risk-1",
  recebido: "info",
  validando: "info",
  quarentena: "risk-3",
  com_erro: "risk-4",
};

const NUM_FMT = new Intl.NumberFormat("pt-BR");
const DATA_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function IngestionPage() {
  const role = useSession((s) => s.role);
  const isAdmin = role === "admin";
  const [importOpen, setImportOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);

  const query = useQuery({
    queryKey: ["ingestion", "files"],
    queryFn: () => apiRequest<ArquivoIngerido[]>("/ingestion/files"),
    // T25: erro dessa query já é sinalizado inline pelo AsyncBoundary;
    // evita toast global duplicado quando o próprio bloco mostra o retry.
    meta: { silent: true },
  });

  const integracoes = useQuery({
    queryKey: ["ingestion", "integrations"],
    queryFn: () => apiRequest<IntegracaoFonte[]>("/ingestion/integrations"),
    meta: { silent: true },
  });

  const files = query.data ?? [];

  const resumoPorFonte = useMemo(() => {
    const map = new Map<ArquivoIngerido["fonte"], FonteResumo>();
    for (const file of files) {
      const atual = map.get(file.fonte) ?? {
        ultimoStatus: null,
        ultimaCarga: null,
        linhas: 0,
        erros: 0,
        arquivos: 0,
      };
      atual.linhas += file.linhas;
      atual.erros += file.erros;
      atual.arquivos += 1;
      if (!atual.ultimaCarga || file.recebidoEm > atual.ultimaCarga) {
        atual.ultimaCarga = file.recebidoEm;
        atual.ultimoStatus = file.status;
      }
      map.set(file.fonte, atual);
    }
    return map;
  }, [files]);

  const columns = useMemo<ColumnDef<ArquivoIngerido>[]>(
    () => [
      {
        accessorKey: "nome",
        header: "Arquivo",
        // Nomes de arquivo não têm espaços: break-all evita largura mínima gigante.
        cell: ({ getValue }) => (
          <span className="break-all font-data text-xs">{getValue<string>()}</span>
        ),
      },
      { accessorKey: "fonte", header: "Fonte" },
      {
        accessorKey: "linhas",
        header: "Linhas",
        meta: { className: "hidden md:table-cell" },
        cell: ({ getValue }) => (
          <span className="font-data">{NUM_FMT.format(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "tamanhoBytes",
        header: "Tamanho",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ getValue }) => <span className="font-data">{humanBytes(getValue<number>())}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => STATUS_LABEL[getValue<ArquivoIngerido["status"]>()],
      },
      {
        accessorKey: "erros",
        header: "Erros",
        cell: ({ getValue }) => <span className="font-data">{getValue<number>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Ingestão e qualidade"
        description="Recebimento e validação de arquivos oficiais (NFS-e, DIMP, ECD, DEFIS, PGDAS e cadastro mobiliário). Módulo 1 do FiscalCheck AI."
        action={
          isAdmin ? (
            <>
              <Button type="button" variant="outline" onClick={() => setIntegrationOpen(true)}>
                <PlugZapIcon aria-hidden="true" className="size-4" />
                Nova integração
              </Button>
              <Button type="button" onClick={() => setImportOpen(true)}>
                <UploadIcon aria-hidden="true" className="size-4" />
                Importar arquivo
              </Button>
            </>
          ) : undefined
        }
      />

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={files.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={<SkeletonTable rows={6} columns={6} />}
        empty={
          <EmptyState
            icon={InboxIcon}
            title="Nenhum arquivo processado nas últimas 24h"
            description="Assim que uma nova ingestão de NFS-e, DIMP, ECD, DEFIS, PGDAS ou cadastro mobiliário chegar, os arquivos aparecerão aqui."
          />
        }
      >
        <div className="grid gap-10">
          <section
            aria-label="Fontes de dados conectadas"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {FONTES.map(({ fonte, label, descricao, icon: Icon }) => {
              const resumo = resumoPorFonte.get(fonte);
              return (
                <FonteCard
                  key={fonte}
                  icon={Icon}
                  label={label}
                  descricao={descricao}
                  badge={
                    resumo?.ultimoStatus ? (
                      <StatusBadge
                        kind="manual"
                        tone={STATUS_TONE[resumo.ultimoStatus]}
                        label={STATUS_LABEL[resumo.ultimoStatus]}
                      />
                    ) : (
                      <StatusBadge kind="manual" tone="neutral" label="Aguardando carga" />
                    )
                  }
                  registros={resumo ? NUM_FMT.format(resumo.linhas) : "—"}
                  erros={resumo ? NUM_FMT.format(resumo.erros) : "—"}
                  errosDestaque={Boolean(resumo && resumo.erros > 0)}
                  ultimaCarga={
                    resumo?.ultimaCarga ? DATA_FMT.format(new Date(resumo.ultimaCarga)) : "—"
                  }
                />
              );
            })}

            {/* Integrações criadas pelo Admin (RF 3.1.1 — fonte nova sem refactor). */}
            {(integracoes.data ?? []).map((integracao) => (
              <FonteCard
                key={integracao.id}
                icon={PlugZapIcon}
                label={integracao.nome}
                descricao={integracao.descricao || "Fonte de dados personalizada"}
                badge={<StatusBadge kind="manual" tone="neutral" label="Aguardando carga" />}
                registros="—"
                erros="—"
                errosDestaque={false}
                ultimaCarga="—"
                rodape={`Integração personalizada · ${INTEGRACAO_TIPO_LABEL[integracao.tipo]} · carga ${INTEGRACAO_PERIODICIDADE_LABEL[integracao.periodicidade]}`}
              />
            ))}
          </section>

          <DataTable
            columns={columns}
            data={files}
            searchable
            searchPlaceholder="Buscar por nome, fonte…"
            emptyMessage="Nenhum arquivo corresponde ao filtro atual."
          />
        </div>
      </AsyncBoundary>

      <ImportFileDialog open={importOpen} onOpenChange={setImportOpen} />
      <NewIntegrationDialog open={integrationOpen} onOpenChange={setIntegrationOpen} />
    </div>
  );
}

type FonteCardProps = {
  icon: LucideIcon;
  label: string;
  descricao: string;
  badge: ReactNode;
  registros: string;
  erros: string;
  errosDestaque: boolean;
  ultimaCarga: string;
  rodape?: string;
};

function FonteCard({
  icon: Icon,
  label,
  descricao,
  badge,
  registros,
  erros,
  errosDestaque,
  ultimaCarga,
  rodape,
}: FonteCardProps) {
  return (
    <article className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-050 text-brand"
          >
            <Icon className="size-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold leading-tight text-text-strong">{label}</h3>
            <p className="text-[11.5px] leading-snug text-muted-foreground">{descricao}</p>
          </div>
        </div>
        {badge}
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
            Registros
          </dt>
          <dd className="font-data text-sm font-semibold text-text-strong">{registros}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
            Erros
          </dt>
          <dd
            className={
              errosDestaque
                ? "font-data text-sm font-semibold text-[color:var(--c-risk-4)]"
                : "font-data text-sm font-semibold text-text-strong"
            }
          >
            {erros}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
            Última carga
          </dt>
          <dd className="font-data text-sm font-semibold text-text-strong">{ultimaCarga}</dd>
        </div>
      </dl>

      {rodape ? (
        <p className="border-t border-dashed border-border pt-2 text-[10.5px] text-muted-foreground">
          {rodape}
        </p>
      ) : null}
    </article>
  );
}
