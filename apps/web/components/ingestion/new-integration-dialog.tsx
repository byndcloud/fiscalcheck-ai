"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlugZapIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api-client";
import type {
  IntegracaoFonte,
  IntegracaoPeriodicidade,
  IntegracaoTipo,
} from "@/mocks/fixtures/arquivos";
import { useSession } from "@/stores/session-store";

/*
  Cadastro de nova integração de fonte (módulo 1 — ADMIN ONLY).

  Materializa o requisito "conectores via API, sem refactor para
  adicionar fonte" (RF 3.1.1): o Admin registra o conector e ele
  aparece na grade como "Aguardando carga" até a primeira ingestão.
*/

const TIPO_OPTIONS: { value: IntegracaoTipo; label: string }[] = [
  { value: "api", label: "API REST" },
  { value: "sftp", label: "SFTP (arquivos)" },
  { value: "upload_manual", label: "Upload manual" },
];

const PERIODICIDADE_OPTIONS: { value: IntegracaoPeriodicidade; label: string }[] = [
  { value: "tempo_real", label: "Tempo real" },
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
];

const IntegrationFormSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome da integração (mínimo 3 caracteres)."),
  tipo: z.enum(["api", "sftp", "upload_manual"]),
  periodicidade: z.enum(["tempo_real", "diaria", "semanal", "mensal"]),
  descricao: z.string().trim().max(200, "Máximo 200 caracteres.").optional(),
});

type IntegrationFormValues = z.infer<typeof IntegrationFormSchema>;

const DEFAULTS: IntegrationFormValues = {
  nome: "",
  tipo: "api",
  periodicidade: "diaria",
  descricao: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewIntegrationDialog({ open, onOpenChange }: Props) {
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const queryClient = useQueryClient();

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(IntegrationFormSchema),
    defaultValues: DEFAULTS,
  });

  const criar = useMutation({
    mutationFn: (values: IntegrationFormValues) =>
      apiRequest<IntegracaoFonte>("/ingestion/integrations", {
        method: "POST",
        headers: {
          "X-Actor-Role": role ?? "admin",
          "X-Actor-Id": user?.id ?? "mock-admin",
          "X-Actor-Name": user?.displayName ?? "Administrador",
        },
        body: values,
      }),
    onSuccess: (integracao) => {
      queryClient.invalidateQueries({ queryKey: ["ingestion", "integrations"] });
      toast.success(
        `Integração "${integracao.nome}" criada — aguardando primeira carga. Ação registrada na trilha.`,
      );
      form.reset(DEFAULTS);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao criar a integração.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlugZapIcon aria-hidden="true" className="size-4 text-brand" />
            Nova integração de fonte
          </DialogTitle>
          <DialogDescription>
            Registra um novo conector de dados sem alteração de código (RF 3.1.1). A fonte aparece
            na grade como "Aguardando carga" até a primeira ingestão.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => criar.mutate(values))}
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da fonte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Cartórios — transações imobiliárias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de conector</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodicidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodicidade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Periodicidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERIODICIDADE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="O que esta fonte traz para o cruzamento?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={criar.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending ? "Criando…" : "Criar integração"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
