"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  FileTextIcon,
  FolderOpenIcon,
  GaugeIcon,
  LandmarkIcon,
  LockIcon,
  ReceiptIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import type {
  Caso,
  Contribuinte,
  Contribuinte360,
  DeclaracaoResumo,
  DividaAtivaItem,
  NFSe,
  Pagamento,
  Score,
} from "@fiscalcheck/shared-types";

import { RiskGauge } from "@/components/risk/risk-gauge";
import { ScoreFactorsPanel } from "@/components/risk/score-factors-panel";
import { ScoreHistoryChart } from "@/components/risk/score-history-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, apiRequest } from "@/lib/api-client";
import { formatCurrencyBRL } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import { useDossieStore } from "@/stores/dossie-store";

/*
  Visão 360 do contribuinte — T08 · módulo 3 · RF03/FA03.

  Página de detalhe da fila de risco: agrega cadastro, score com XAI
  (T09 embutido), evolução histórica, declarações × NFS-e, dívida ativa,
  pagamentos e casos vinculados numa única consulta ao mock
  `GET /taxpayers/:id/360`.

  Human-in-the-loop: a "Próxima ação recomendada" é sempre rotulada como
  recomendação do agente — nunca como fato consumado (AGENTS.md §1.1).
  LGPD: CNPJ, CPF de sócios e CDA carregam `data-sensitive` para o
  mascaramento do módulo 6.
*/

const REGIME_LABEL: Record<Contribuinte["regime"], string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
};

const SITUACAO_CADASTRAL_LABEL: Record<Contribuinte["situacao"], string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  baixada: "Baixada",
  inapta: "Inapta",
  nula: "Nula",
};

const FONTE_LABEL: Record<DeclaracaoResumo["fonte"], string> = {
  pgdas: "PGDAS",
  des: "DES",
};

type BadgeTone = "risk-1" | "risk-2" | "risk-3" | "risk-4" | "risk-5" | "neutral" | "info";

const STATUS_DECLARACAO_BADGE: Record<
  DeclaracaoResumo["status"],
  { tone: BadgeTone; label: string }
> = {
  entregue: { tone: "risk-1", label: "Entregue" },
  retificada: { tone: "risk-3", label: "Retificada" },
  omissa: { tone: "risk-5", label: "Omissa" },
};

const SITUACAO_NFSE_BADGE: Record<NFSe["situacao"], { tone: BadgeTone; label: string }> = {
  emitida: { tone: "risk-1", label: "Emitida" },
  cancelada: { tone: "risk-5", label: "Cancelada" },
  substituida: { tone: "info", label: "Substituída" },
};

const SITUACAO_DIVIDA_BADGE: Record<
  DividaAtivaItem["situacao"],
  { tone: BadgeTone; label: string }
> = {
  inscrita: { tone: "risk-3", label: "Inscrita" },
  parcelada: { tone: "info", label: "Parcelada" },
  protestada: { tone: "risk-5", label: "Protestada" },
  quitada: { tone: "risk-1", label: "Quitada" },
};

const ORIGEM_PAGAMENTO_LABEL: Record<Pagamento["origem"], string> = {
  dam: "DAM",
  parcelamento: "Parcelamento",
  autorregularizacao: "Autorregularização",
};

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const DATE_TIME_FMT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/* Datas ISO só-data são ancoradas no fuso local para não recuar um dia (UTC-3). */
function formatDateBR(iso: string): string {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return DATE_FMT.format(date);
}

function formatCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return ano && mes ? `${mes}/${ano}` : competencia;
}

/* Classes compartilhadas das tabelas — cabeçalho em label caps 11/700 (DS §4). */
const LABEL_CAPS = "text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";
const TH = "px-3 py-2.5";
const TD = "px-3 py-2.5 align-top";

export default function Contribuinte360Page() {
  const params = useParams<{ contribuinteId: string }>();
  const contribuinteId = params.contribuinteId;

  const query = useQuery({
    queryKey: ["taxpayers", contribuinteId, "360"],
    queryFn: () => apiRequest<Contribuinte360>(`/taxpayers/${contribuinteId}/360`),
    meta: { silent: true },
    retry: false,
  });

  if (query.isPending) return <PageSkeleton />;

  if (query.isError) {
    return <PageError error={query.error} onRetry={() => void query.refetch()} />;
  }

  const { contribuinte, score, scoreHistorico, declaracoes, nfse, dividaAtiva, pagamentos, casos } =
    query.data;

  return (
    <div className="grid gap-6">
      <TaxpayerHeader contribuinte={contribuinte} score={score} />
      <HeroSection score={score} />

      <Tabs defaultValue="visao-geral" className="gap-4">
        <TabsList className="max-w-full flex-wrap sm:h-9">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="declaracoes">Declarações &amp; NFS-e</TabsTrigger>
          <TabsTrigger value="divida">Dívida &amp; pagamentos</TabsTrigger>
          <TabsTrigger value="casos">Casos vinculados</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="grid items-start gap-4 lg:grid-cols-2">
          {score ? (
            <ScoreFactorsPanel score={score} />
          ) : (
            <EmptyState
              icon={GaugeIcon}
              title="Sem fatores de score"
              description="Este contribuinte ainda não foi pontuado pelo modelo de risco — não há explicabilidade a exibir."
            />
          )}
          <div className="grid gap-4">
            <Card className="gap-3 py-5">
              <CardContent className="grid gap-3 px-5">
                <h3 className={LABEL_CAPS}>Evolução do score</h3>
                <ScoreHistoryChart historico={scoreHistorico} />
              </CardContent>
            </Card>
            <RegistrationCard contribuinte={contribuinte} />
          </div>
        </TabsContent>

        <TabsContent value="declaracoes" className="grid items-start gap-4 xl:grid-cols-2">
          <DeclaracoesTable declaracoes={declaracoes} />
          <NfseTable notas={nfse} />
        </TabsContent>

        <TabsContent value="divida" className="grid items-start gap-4 xl:grid-cols-2">
          <DividaAtivaTable itens={dividaAtiva} />
          <PagamentosTable pagamentos={pagamentos} />
        </TabsContent>

        <TabsContent value="casos">
          <LinkedCasesList casos={casos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BackToQueueButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/fila-de-risco">
        <ArrowLeftIcon aria-hidden="true" />
        Voltar para a fila de risco
      </Link>
    </Button>
  );
}

function PageError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const notFound = error instanceof ApiError && error.status === 404;

  if (notFound) {
    return (
      <ErrorState
        title="Contribuinte não encontrado"
        description="Não localizamos este contribuinte na base atual. Verifique o identificador ou volte para a fila de risco."
        action={<BackToQueueButton />}
      />
    );
  }

  return (
    <ErrorState
      error={error}
      title="Não foi possível carregar a visão 360"
      onRetry={onRetry}
      action={<BackToQueueButton />}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 border-b border-border pb-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <SkeletonCard height="h-52" />
      <div className="grid gap-4">
        <Skeleton className="h-9 w-full max-w-lg" />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonTable rows={4} columns={3} />
          <SkeletonTable rows={4} columns={3} />
        </div>
      </div>
    </div>
  );
}

function TaxpayerHeader({
  contribuinte,
  score,
}: {
  contribuinte: Contribuinte;
  score: Score | undefined;
}) {
  return (
    <header className="grid gap-3 border-b border-border pb-5">
      <Link
        href="/fila-de-risco"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Fila de risco
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <p className={LABEL_CAPS}>Visão 360 do contribuinte</p>
          {/* H1 de página de detalhe — Raleway 28/800 (DS §4) */}
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-text-strong">
            {contribuinte.razaoSocial}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span data-sensitive className="font-data text-[13px] text-foreground">
              {contribuinte.cnpjMascarado}
            </span>
            {contribuinte.inscricaoMunicipal ? (
              <span>
                IM{" "}
                <span data-sensitive className="font-data text-[13px]">
                  {contribuinte.inscricaoMunicipal}
                </span>
              </span>
            ) : null}
            <span>{REGIME_LABEL[contribuinte.regime]}</span>
            <span>Situação cadastral: {SITUACAO_CADASTRAL_LABEL[contribuinte.situacao]}</span>
          </div>
        </div>
        {score ? <StatusBadge kind="risk" level={score.nivel} /> : null}
      </div>
    </header>
  );
}

function HeroSection({ score }: { score: Score | undefined }) {
  if (!score) {
    return (
      <EmptyState
        icon={GaugeIcon}
        title="Sem score calculado"
        description="Este contribuinte ainda não foi pontuado pelo modelo de risco. Assim que houver dados suficientes, o score aparecerá aqui."
      />
    );
  }

  return (
    <Card className="py-5">
      <CardContent className="grid gap-6 px-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <RiskGauge valor={score.valor} nivel={score.nivel} className="justify-self-center" />
        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={LABEL_CAPS}>Próxima ação recomendada</h2>
            {/* Microtag de origem agêntica (DS §3.2) — saída de IA nunca vira fato consumado */}
            <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--c-aurora)_12%,var(--surface))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aurora">
              <SparklesIcon aria-hidden="true" className="size-3" />
              Recomendação do agente
            </span>
          </div>
          <p className="text-[15px] font-semibold leading-snug text-text-strong">
            {score.proximaAcaoRecomendada ?? "Sem recomendação registrada para este contribuinte."}
          </p>
          <p className="font-data text-[11px] text-muted-foreground">
            Modelo {score.modeloVersao} · calculado em{" "}
            {DATE_TIME_FMT.format(new Date(score.calculadoEm))}
          </p>
          <p className="flex items-center gap-1.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
            <LockIcon aria-hidden="true" className="size-3.5 shrink-0 text-brand" />O agente
            recomenda · a decisão é do auditor
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RegistrationCard({ contribuinte }: { contribuinte: Contribuinte }) {
  const socios = contribuinte.socios ?? [];
  return (
    <Card className="gap-3 py-5">
      <CardContent className="grid gap-4 px-5">
        <h3 className={LABEL_CAPS}>Dados cadastrais</h3>
        <dl className="grid gap-3 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Atividade principal (CNAE)</dt>
            <dd className="font-medium text-text-strong">
              {contribuinte.atividadePrincipal ?? "Não informada"}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Endereço</dt>
            <dd className="font-medium text-text-strong">
              {contribuinte.endereco ?? "Não informado"}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Município / UF</dt>
            <dd className="font-medium text-text-strong">
              {contribuinte.municipio} / {contribuinte.uf}
            </dd>
          </div>
        </dl>
        <div className="grid gap-2 border-t border-border pt-3">
          <h4 className={LABEL_CAPS}>Quadro societário</h4>
          {socios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Quadro societário não informado.</p>
          ) : (
            <ul className="grid">
              {socios.map((socio) => (
                <li
                  key={`${socio.nome}-${socio.cpfMascarado}`}
                  className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-b-0"
                >
                  <div className="grid gap-0.5">
                    <p className="text-sm font-semibold text-text-strong">
                      {socio.nome}
                      {socio.qualificacao ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {socio.qualificacao}
                        </span>
                      ) : null}
                    </p>
                    <p data-sensitive className="font-data text-xs text-muted-foreground">
                      {socio.cpfMascarado}
                    </p>
                  </div>
                  <span className="font-data text-sm font-semibold text-text-strong">
                    {socio.participacao}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* Card de tabela com header próprio e corpo full-bleed. */
function TableCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <header className="border-b border-border px-5 py-4">
        <h3 className={LABEL_CAPS}>{title}</h3>
      </header>
      {children}
    </Card>
  );
}

function DeclaracoesTable({ declaracoes }: { declaracoes: DeclaracaoResumo[] }) {
  return (
    <TableCard title="Declarações">
      {declaracoes.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="Nenhuma declaração no período analisado"
          className="m-4 border-0 p-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className={cn("border-b border-border bg-n-50/60", LABEL_CAPS)}>
              <tr>
                <th scope="col" className={TH}>
                  Competência
                </th>
                <th scope="col" className={TH}>
                  Fonte
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Receita declarada
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  ISS apurado
                </th>
                <th scope="col" className={TH}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {declaracoes.map((declaracao) => {
                const badge = STATUS_DECLARACAO_BADGE[declaracao.status];
                return (
                  <tr
                    key={`${declaracao.competencia}-${declaracao.fonte}`}
                    className="border-b border-border/60 last:border-b-0 hover:bg-n-50/60"
                  >
                    <td className={cn(TD, "font-data text-[12px] text-text-strong")}>
                      {formatCompetencia(declaracao.competencia)}
                    </td>
                    <td className={cn(TD, "font-data text-[11px] font-semibold uppercase")}>
                      {FONTE_LABEL[declaracao.fonte]}
                    </td>
                    <td className={cn(TD, "text-right font-data text-[12px]")}>
                      {formatCurrencyBRL(declaracao.receitaDeclarada)}
                    </td>
                    <td className={cn(TD, "text-right font-data text-[12px]")}>
                      {formatCurrencyBRL(declaracao.issApurado)}
                    </td>
                    <td className={TD}>
                      <StatusBadge kind="manual" tone={badge.tone} label={badge.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}

function NfseTable({ notas }: { notas: NFSe[] }) {
  return (
    <TableCard title="NFS-e emitidas">
      {notas.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Nenhuma NFS-e emitida no período"
          className="m-4 border-0 p-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className={cn("border-b border-border bg-n-50/60", LABEL_CAPS)}>
              <tr>
                <th scope="col" className={TH}>
                  Número
                </th>
                <th scope="col" className={TH}>
                  Competência
                </th>
                <th scope="col" className={TH}>
                  Emissão
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Valor dos serviços
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  ISS
                </th>
                <th scope="col" className={TH}>
                  Situação
                </th>
              </tr>
            </thead>
            <tbody>
              {notas.map((nota) => {
                const badge = SITUACAO_NFSE_BADGE[nota.situacao];
                return (
                  <tr
                    key={nota.id}
                    className="border-b border-border/60 last:border-b-0 hover:bg-n-50/60"
                  >
                    <td className={cn(TD, "font-data text-[12px] text-text-strong")}>
                      {nota.numero}
                    </td>
                    <td className={cn(TD, "font-data text-[12px]")}>
                      {formatCompetencia(nota.competencia)}
                    </td>
                    <td className={cn(TD, "font-data text-[12px]")}>
                      {formatDateBR(nota.dataEmissao)}
                    </td>
                    <td className={cn(TD, "text-right font-data text-[12px]")}>
                      {formatCurrencyBRL(nota.valorServicos)}
                    </td>
                    <td className={cn(TD, "text-right font-data text-[12px]")}>
                      {formatCurrencyBRL(nota.iss)}
                    </td>
                    <td className={TD}>
                      <StatusBadge kind="manual" tone={badge.tone} label={badge.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}

function DividaAtivaTable({ itens }: { itens: DividaAtivaItem[] }) {
  return (
    <TableCard title="Dívida ativa">
      {itens.length === 0 ? (
        <EmptyState
          icon={LandmarkIcon}
          title="Sem inscrições em dívida ativa"
          className="m-4 border-0 p-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className={cn("border-b border-border bg-n-50/60", LABEL_CAPS)}>
              <tr>
                <th scope="col" className={TH}>
                  CDA
                </th>
                <th scope="col" className={TH}>
                  Exercício
                </th>
                <th scope="col" className={TH}>
                  Tributo
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Valor atualizado
                </th>
                <th scope="col" className={TH}>
                  Situação
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const badge = SITUACAO_DIVIDA_BADGE[item.situacao];
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-b-0 hover:bg-n-50/60"
                  >
                    <td data-sensitive className={cn(TD, "font-data text-[12px] text-text-strong")}>
                      {item.cda}
                    </td>
                    <td className={cn(TD, "font-data text-[12px]")}>{item.exercicio}</td>
                    <td className={cn(TD, "font-data text-[11px] font-semibold uppercase")}>
                      {item.tributo}
                    </td>
                    <td className={cn(TD, "text-right font-data text-[12px]")}>
                      {formatCurrencyBRL(item.valorAtualizado)}
                    </td>
                    <td className={TD}>
                      <StatusBadge kind="manual" tone={badge.tone} label={badge.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}

function PagamentosTable({ pagamentos }: { pagamentos: Pagamento[] }) {
  return (
    <TableCard title="Histórico de pagamentos">
      {pagamentos.length === 0 ? (
        <EmptyState
          icon={BarChart3Icon}
          title="Nenhum pagamento registrado no período"
          className="m-4 border-0 p-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className={cn("border-b border-border bg-n-50/60", LABEL_CAPS)}>
              <tr>
                <th scope="col" className={TH}>
                  Competência
                </th>
                <th scope="col" className={TH}>
                  Tributo
                </th>
                <th scope="col" className={TH}>
                  Origem
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Valor pago
                </th>
                <th scope="col" className={TH}>
                  Pago em
                </th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((pagamento) => (
                <tr
                  key={pagamento.id}
                  className="border-b border-border/60 last:border-b-0 hover:bg-n-50/60"
                >
                  <td className={cn(TD, "font-data text-[12px] text-text-strong")}>
                    {formatCompetencia(pagamento.competencia)}
                  </td>
                  <td className={cn(TD, "font-data text-[11px] font-semibold uppercase")}>
                    {pagamento.tributo}
                  </td>
                  <td className={TD}>{ORIGEM_PAGAMENTO_LABEL[pagamento.origem]}</td>
                  <td className={cn(TD, "text-right font-data text-[12px]")}>
                    {formatCurrencyBRL(pagamento.valorPago)}
                  </td>
                  <td className={cn(TD, "font-data text-[12px]")}>
                    {formatDateBR(pagamento.pagoEm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}

function LinkedCasesList({ casos }: { casos: Caso[] }) {
  const openDossie = useDossieStore((s) => s.openDossie);

  if (casos.length === 0) {
    return <EmptyState icon={FolderOpenIcon} title="Nenhum caso vinculado a este contribuinte" />;
  }

  return (
    <ul className="grid gap-3">
      {casos.map((caso) => (
        <li key={caso.id}>
          <Card className="gap-0 py-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5">
              <div className="grid gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-data text-[13px] font-bold uppercase text-brand">
                    {caso.id.toUpperCase()}
                  </span>
                  <StatusBadge kind="status" status={caso.status} />
                </div>
                {caso.proximaAcaoRecomendada ? (
                  <p className="text-sm text-muted-foreground">
                    Próxima ação: {caso.proximaAcaoRecomendada}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Atualizado em {formatDateBR(caso.atualizadoEm)}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <div className="grid gap-0.5 text-right">
                  <p className={LABEL_CAPS}>Valor potencial</p>
                  <p className="font-display text-[19px] font-bold text-text-strong">
                    {formatCurrencyBRL(caso.valorPotencial)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openDossie(caso.id)}
                >
                  Abrir dossiê
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
