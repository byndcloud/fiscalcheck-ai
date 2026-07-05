"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlusIcon, Loader2Icon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api-client";
import { notify } from "@/lib/toast";

/*
  Agendamento de atendimento (T16 · módulo 4 · RF07).
  Data + período; o mock confirma imediatamente e gera protocolo.
*/

const AgendamentoFormSchema = z.object({
  data: z.string().min(10, "Escolha uma data para o atendimento."),
  periodo: z.enum(["manha", "tarde"], { message: "Escolha um período." }),
});

type AgendamentoFormValues = z.infer<typeof AgendamentoFormSchema>;

type Props = {
  caso: Caso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AgendamentoDialog({ caso, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<AgendamentoFormValues>({
    resolver: zodResolver(AgendamentoFormSchema),
    defaultValues: { data: "", periodo: "manha" },
  });

  const agendamento = useMutation({
    mutationFn: (values: AgendamentoFormValues) =>
      apiRequest<CitizenActionResponse>(`/citizen/cases/${caso?.id}/agendamento`, {
        method: "POST",
        body: values,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["citizen"] });
      notify.success("Atendimento agendado.", {
        description: `Protocolo ${data.interacao.protocolo}. Você receberá a confirmação pelos canais cadastrados.`,
      });
      form.reset();
      onOpenChange(false);
    },
  });

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (!caso) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlusIcon aria-hidden className="size-4 text-brand" />
            Agendar atendimento
          </DialogTitle>
          <DialogDescription>
            Prefere conversar com alguém? Agende um horário com a equipe da Secretaria da Fazenda de
            Brusque — presencial ou por vídeo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => agendamento.mutate(values))}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" min={minDate} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Período do atendimento">
                        <SelectValue placeholder="Escolha o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manha">Manhã (8h às 12h)</SelectItem>
                      <SelectItem value="tarde">Tarde (13h às 17h)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={agendamento.isPending}>
                {agendamento.isPending ? (
                  <>
                    <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
                    Agendando…
                  </>
                ) : (
                  "Confirmar agendamento"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
