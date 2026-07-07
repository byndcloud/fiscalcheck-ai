"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadIcon } from "lucide-react";
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
import { ApiError, apiRequest } from "@/lib/api-client";
import type { ArquivoIngerido } from "@/mocks/fixtures/arquivos";
import { useSession } from "@/stores/session-store";

/*
  Importação manual de arquivo (módulo 1 — ADMIN ONLY).

  Complementa o agente 24/7: quando um órgão envia uma carga fora do
  ciclo automático, o Admin registra o arquivo aqui e a validação de
  esquema entra na mesma esteira. A ação fica registrada na trilha
  (append-only) pelo handler.
*/

const FONTE_OPTIONS: { value: ArquivoIngerido["fonte"]; label: string }[] = [
  { value: "NFSe", label: "NFS-e" },
  { value: "PGDAS", label: "PGDAS-D" },
  { value: "DIMP", label: "DIMP" },
  { value: "DEFIS", label: "DEFIS" },
  { value: "ECD", label: "ECD" },
  { value: "Cadastro", label: "Cadastro Mobiliário" },
];

const ImportFormSchema = z.object({
  fonte: z.enum(["NFSe", "DIMP", "ECD", "DEFIS", "PGDAS", "Cadastro"]),
  nome: z
    .string()
    .trim()
    .min(5, "Informe o nome do arquivo (mínimo 5 caracteres).")
    .regex(/\.(xml|csv|zip|xlsx|txt)$/i, "Extensão esperada: .xml, .csv, .zip, .xlsx ou .txt."),
});

type ImportFormValues = z.infer<typeof ImportFormSchema>;

const DEFAULTS: ImportFormValues = { fonte: "NFSe", nome: "" };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportFileDialog({ open, onOpenChange }: Props) {
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const queryClient = useQueryClient();

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(ImportFormSchema),
    defaultValues: DEFAULTS,
  });

  const importar = useMutation({
    mutationFn: (values: ImportFormValues) =>
      apiRequest<ArquivoIngerido>("/ingestion/files/import", {
        method: "POST",
        headers: {
          "X-Actor-Role": role ?? "admin",
          "X-Actor-Id": user?.id ?? "mock-admin",
          "X-Actor-Name": user?.displayName ?? "Administrador",
        },
        body: values,
      }),
    onSuccess: (arquivo) => {
      queryClient.invalidateQueries({ queryKey: ["ingestion", "files"] });
      toast.success(
        `Arquivo ${arquivo.nome} recebido — validação de esquema iniciada. Ação registrada na trilha.`,
      );
      form.reset(DEFAULTS);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao importar o arquivo.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon aria-hidden="true" className="size-4 text-brand" />
            Importar arquivo manualmente
          </DialogTitle>
          <DialogDescription>
            Registra uma carga fora do ciclo automático do agente. O arquivo entra na mesma esteira
            de validação de esquema e qualidade.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => importar.mutate(values))}
          >
            <FormField
              control={form.control}
              name="fonte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte de dados</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FONTE_OPTIONS.map((opt) => (
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
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do arquivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: NFSE_2026_07_Brusque.xml" {...field} />
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
                disabled={importar.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={importar.isPending}>
                {importar.isPending ? "Importando…" : "Importar arquivo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
