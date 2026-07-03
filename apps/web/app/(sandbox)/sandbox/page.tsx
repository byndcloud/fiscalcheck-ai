"use client";

import {
  BellIcon,
  BriefcaseIcon,
  CircleAlertIcon,
  DatabaseIcon,
  MailIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";

/*
  Catálogo vivo dos componentes do Design System (mockup-sandbox).
  Rota fora do sidebar principal — acesso por URL /sandbox.
  Não faz guard de sessão: útil pra revisão de DS sem estar logado.
*/

type Row = { id: string; nome: string; risco: number; valor: number };

const SANDBOX_ROWS: Row[] = [
  { id: "sb-01", nome: "Contribuinte Alfa", risco: 82, valor: 84500 },
  { id: "sb-02", nome: "Contribuinte Beta", risco: 44, valor: 12300 },
  { id: "sb-03", nome: "Contribuinte Gama", risco: 91, valor: 213000 },
];

export default function SandboxPage() {
  const [text, setText] = useState("");
  const [selection, setSelection] = useState("auditor");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10">
      <PageHeader
        title="Sandbox do Design System"
        description="Catálogo dos componentes DS + tokens em uso. Use esta página para inspecionar variantes e comportamentos sem interferir no fluxo principal."
      />

      <SandboxSection
        title="Botões"
        description="Variantes primárias, secundárias, aurora (IA) e destrutiva."
      >
        <div className="flex flex-wrap gap-3">
          <Button>Padrão</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="aurora">
            <SparklesIcon aria-hidden /> Assistente IA
          </Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button size="sm">Pequeno</Button>
          <Button size="lg">Grande</Button>
          <Button size="icon" aria-label="Notificações">
            <BellIcon aria-hidden />
          </Button>
        </div>
      </SandboxSection>

      <SandboxSection
        title="Cards"
        description="Container padrão com raio --r-lg, elevação --e-1 → --e-2 no hover."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Casos abertos</CardTitle>
              <CardDescription>Trimestre atual</CardDescription>
            </CardHeader>
            <CardContent className="font-display text-3xl font-semibold text-text-strong">
              42
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Valor recuperável</CardTitle>
              <CardDescription>Estimativa mock</CardDescription>
            </CardHeader>
            <CardContent className="font-display text-3xl font-semibold text-text-strong">
              R$ 3.284.500
            </CardContent>
          </Card>
        </div>
      </SandboxSection>

      <SandboxSection
        title="Campos e formulário"
        description="Input com foco brand-050, Label, Select DS."
      >
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sb-input">Nome do contribuinte</Label>
            <Input
              id="sb-input"
              placeholder="Digite para filtrar…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sb-select">Papel de teste</Label>
            <Select value={selection} onValueChange={setSelection}>
              <SelectTrigger id="sb-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auditor">Auditor fiscal</SelectItem>
                <SelectItem value="supervisor">Gestor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="cidadao">Contribuinte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SandboxSection>

      <SandboxSection
        title="Status & Badges"
        description="Espectro de risco DS §3.3 e badges semânticos."
      >
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge kind="risk" level="conforme" />
            <StatusBadge kind="risk" level="baixo" />
            <StatusBadge kind="risk" level="medio" />
            <StatusBadge kind="risk" level="alto" />
            <StatusBadge kind="risk" level="critico" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge kind="status" status="candidato" />
            <StatusBadge kind="status" status="em_analise" />
            <StatusBadge kind="status" status="aguardando_aprovacao" />
            <StatusBadge kind="status" status="notificado" />
            <StatusBadge kind="status" status="em_autorregularizacao" />
            <StatusBadge kind="status" status="fiscalizacao" />
            <StatusBadge kind="status" status="encerrado" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Padrão</Badge>
            <Badge variant="secondary">Secundário</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Sucesso</Badge>
            <Badge variant="warning">Alerta</Badge>
            <Badge variant="danger">Erro</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </SandboxSection>

      <SandboxSection title="Sobreposições" description="Dialog, Popover e Toaster (sonner).">
        <div className="flex flex-wrap gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar autorregularização</DialogTitle>
                <DialogDescription>
                  Esta ação enviará uma notificação amigável ao contribuinte e ficará registrada na
                  trilha de auditoria.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setDialogOpen(false);
                    toast.success("Notificação enviada (mock).");
                  }}
                >
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Abrir popover</Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <p className="text-sm font-medium">Referência rápida</p>
              <p className="text-xs text-muted-foreground">
                Popovers usam raio --r-md e elevação --e-2.
              </p>
            </PopoverContent>
          </Popover>

          <Button variant="secondary" onClick={() => toast("Toast informativo (mock).")}>
            <MailIcon aria-hidden /> Disparar toast
          </Button>
          <Button variant="ghost" onClick={() => toast.error("Algo deu errado no fluxo (mock).")}>
            <CircleAlertIcon aria-hidden /> Toast de erro
          </Button>
        </div>
      </SandboxSection>

      <SandboxSection
        title="DataTable"
        description="Encapsula @tanstack/react-table com estilos DS."
      >
        <DataTable
          data={SANDBOX_ROWS}
          searchable
          searchPlaceholder="Filtrar linhas…"
          columns={[
            { accessorKey: "id", header: "ID" },
            { accessorKey: "nome", header: "Nome" },
            {
              accessorKey: "risco",
              header: "Risco",
              cell: ({ getValue }) => <span className="font-mono">{getValue<number>()}</span>,
            },
            {
              accessorKey: "valor",
              header: "Valor (BRL)",
              cell: ({ getValue }) => (
                <span className="font-mono">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(getValue<number>())}
                </span>
              ),
            },
          ]}
        />
      </SandboxSection>

      <SandboxSection title="EmptyState" description="Placeholder padrão para telas sem dados.">
        <div className="grid gap-3 md:grid-cols-2">
          <EmptyState
            icon={DatabaseIcon}
            title="Nenhum arquivo processado"
            description="Aguardando próxima janela de ingestão (a cada 30 minutos)."
          />
          <EmptyState
            icon={BriefcaseIcon}
            title="Sem casos priorizados"
            description="Ninguém acima do limiar de risco 70 nas últimas 24h."
            action={<Button size="sm">Ver todos os casos</Button>}
          />
        </div>
      </SandboxSection>
    </div>
  );
}

function SandboxSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <header>
        <h2 className="font-display text-lg font-semibold text-text-strong">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <Separator />
      <div>{children}</div>
    </section>
  );
}
