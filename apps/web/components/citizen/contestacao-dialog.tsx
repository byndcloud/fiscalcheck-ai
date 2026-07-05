"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, MessageSquareTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Caso, CitizenActionResponse } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { notify } from "@/lib/toast";

/*
  Canal de resposta/contestação (T16 · módulo 4 · RF07).
  Formulário + upload mock (somente metadados dos arquivos — nenhum
  byte é enviado no POC) + protocolo de recebimento. A contestação
  vira devolutiva no caso do auditor.
*/

const ContestacaoFormSchema = z.object({
  assunto: z
    .string()
    .min(5, "Descreva o assunto com pelo menos 5 caracteres.")
    .max(120, "O assunto pode ter no máximo 120 caracteres."),
  mensagem: z
    .string()
    .min(30, "Explique sua contestação com pelo menos 30 caracteres.")
    .max(2000, "A mensagem pode ter no máximo 2.000 caracteres."),
});

type ContestacaoFormValues = z.infer<typeof ContestacaoFormSchema>;

type AnexoMock = { nome: string; tamanhoBytes: number };

type Props = {
  caso: Caso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MAX_ANEXOS = 5;

export function ContestacaoDialog({ caso, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexos, setAnexos] = useState<AnexoMock[]>([]);

  const form = useForm<ContestacaoFormValues>({
    resolver: zodResolver(ContestacaoFormSchema),
    defaultValues: { assunto: "", mensagem: "" },
  });

  const contestacao = useMutation({
    mutationFn: (values: ContestacaoFormValues) =>
      apiRequest<CitizenActionResponse>(`/citizen/cases/${caso?.id}/contestacao`, {
        method: "POST",
        body: { ...values, arquivos: anexos },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["citizen"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      notify.success("Contestação enviada.", {
        description: `Protocolo ${data.interacao.protocolo}. Acompanhe a resposta por aqui e pelos canais cadastrados.`,
      });
      form.reset();
      setAnexos([]);
      onOpenChange(false);
    },
  });

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const novos = Array.from(list).map((f) => ({ nome: f.name, tamanhoBytes: f.size }));
    setAnexos((prev) => [...prev, ...novos].slice(0, MAX_ANEXOS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!caso) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareTextIcon aria-hidden className="size-4 text-brand" />
            Contestar a pendência
          </DialogTitle>
          <DialogDescription>
            Explique por que você não concorda e anexe documentos que comprovem sua situação. A
            equipe fiscal responderá por este canal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => contestacao.mutate(values))}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="assunto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Notas já declaradas em outro período" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mensagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua explicação</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Conte com suas palavras o que aconteceu. Quanto mais detalhes, mais rápida a análise."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <span className="text-sm font-medium text-text-strong">
                Documentos (opcional, até {MAX_ANEXOS})
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                id="contestacao-anexos"
                aria-label="Anexar documentos"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => fileInputRef.current?.click()}
                disabled={anexos.length >= MAX_ANEXOS}
              >
                <PaperclipIcon aria-hidden className="size-3.5" />
                Anexar documento
              </Button>
              {anexos.length > 0 ? (
                <ul className="grid gap-1.5">
                  {anexos.map((anexo) => (
                    <li
                      key={anexo.nome}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-n-25 px-3 py-1.5 text-xs"
                    >
                      <span className="truncate text-foreground">{anexo.nome}</span>
                      <button
                        type="button"
                        aria-label={`Remover ${anexo.nome}`}
                        className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300"
                        onClick={() =>
                          setAnexos((prev) => prev.filter((a) => a.nome !== anexo.nome))
                        }
                      >
                        <XIcon aria-hidden className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Ambiente de demonstração: apenas o nome dos arquivos é registrado — nenhum conteúdo
                é enviado.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={contestacao.isPending}>
                {contestacao.isPending ? (
                  <>
                    <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar contestação"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
