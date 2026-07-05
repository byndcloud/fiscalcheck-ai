"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, Building2Icon, LoaderCircleIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonText } from "@/components/ui/skeleton";
import { useUpdateRegistration, useUserProfile } from "@/hooks/use-user-profile";

/*
  Meus dados — edição do cadastro do contribuinte (T27+ · módulo 4).

  O cidadão edita sozinho apenas contato e endereço. CPF e vínculos
  societários ficam somente leitura: mudam por via formal (Junta
  Comercial / atendimento da Prefeitura) — mostrado em linguagem clara.
*/

const FormSchema = z.object({
  telefone: z
    .string()
    .trim()
    .min(10, "Informe um telefone com DDD, por exemplo (47) 99999-0000.")
    .max(20, "Telefone muito longo."),
  endereco: z
    .string()
    .trim()
    .min(5, "Informe o endereço completo, com rua e número.")
    .max(160, "Endereço muito longo."),
  municipio: z
    .string()
    .trim()
    .min(2, "Informe o município.")
    .max(60, "Nome de município muito longo."),
  uf: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado com 2 letras, por exemplo SC.")
    .regex(/^[A-Za-z]{2}$/, "Use apenas letras na sigla do estado."),
});

type FormValues = z.infer<typeof FormSchema>;

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

export default function CitizenDadosPage() {
  const profileQuery = useUserProfile();
  const updateRegistration = useUpdateRegistration();

  const dados = profileQuery.data?.dadosCadastrais;

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    // `values` mantém o formulário sincronizado quando o perfil chega
    // do serviço — sem useEffect de reset manual.
    values: dados
      ? {
          telefone: dados.telefone,
          endereco: dados.endereco,
          municipio: dados.municipio,
          uf: dados.uf,
        }
      : undefined,
    defaultValues: { telefone: "", endereco: "", municipio: "", uf: "" },
  });

  function onSubmit(values: FormValues) {
    updateRegistration.mutate({ ...values, uf: values.uf.toUpperCase() });
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <Link
        href="/citizen"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand focus-visible:outline-none focus-visible:underline"
      >
        <ArrowLeftIcon aria-hidden className="size-3.5" />
        Voltar às pendências
      </Link>

      <PageHeader
        title="Meus dados"
        description="Confira e atualize suas informações de contato e endereço. Manter o cadastro em dia garante que você receba nossos avisos."
      />

      {profileQuery.isPending ? (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--e-1)]">
          <SkeletonText lines={6} />
        </div>
      ) : !dados ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground shadow-[var(--e-1)]">
          Não encontramos seus dados cadastrais. Tente recarregar a página ou procure o atendimento
          da Prefeitura.
        </p>
      ) : (
        <>
          <section
            aria-label="Identificação"
            className="grid gap-3 rounded-lg border border-border bg-surface p-6 shadow-[var(--e-1)]"
          >
            <div>
              <h2 className="text-sm font-semibold text-text-strong">Identificação</h2>
              <p className="text-xs text-muted-foreground">
                Estes dados vêm da sua conta gov.br e do cadastro oficial — não podem ser alterados
                por aqui.
              </p>
            </div>
            <dl className="grid gap-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium text-text-strong">{profileQuery.data?.nome}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">CPF</dt>
                <dd className="font-data" data-sensitive>
                  {dados.cpfMascarado}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="text-text-strong">{profileQuery.data?.email}</dd>
              </div>
            </dl>
          </section>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-[var(--e-1)]"
            >
              <div>
                <h2 className="text-sm font-semibold text-text-strong">Contato e endereço</h2>
                <p className="text-xs text-muted-foreground">
                  Última atualização em {DATE_FORMAT.format(new Date(dados.atualizadoEm))}.
                </p>
              </div>

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(47) 99999-0000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="street-address"
                        placeholder="Rua, número e bairro"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level2" placeholder="Brusque" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF)</FormLabel>
                      <FormControl>
                        <Input
                          maxLength={2}
                          autoComplete="address-level1"
                          placeholder="SC"
                          className="uppercase"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateRegistration.isPending}>
                  {updateRegistration.isPending ? (
                    <>
                      <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <SaveIcon aria-hidden="true" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <section
            aria-label="Empresas vinculadas"
            className="grid gap-3 rounded-lg border border-border bg-surface p-6 shadow-[var(--e-1)]"
          >
            <div>
              <h2 className="text-sm font-semibold text-text-strong">Empresas vinculadas</h2>
              <p className="text-xs text-muted-foreground">
                Mudanças societárias (entrada ou saída de empresas) são feitas na Junta Comercial ou
                no atendimento da Prefeitura — não podem ser alteradas pelo portal.
              </p>
            </div>
            <ul className="grid gap-3">
              {dados.empresasVinculadas.map((empresa) => (
                <li key={empresa.cnpjMascarado} className="flex items-start gap-3 text-sm">
                  <Building2Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="grid gap-0.5">
                    <span className="font-medium text-text-strong leading-tight">
                      {empresa.razaoSocial}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <span data-sensitive className="font-data">
                        {empresa.cnpjMascarado}
                      </span>
                      {" · Inscrição municipal "}
                      <span className="font-data">{empresa.inscricaoMunicipal}</span>
                      {" · "}
                      {empresa.vinculo}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
