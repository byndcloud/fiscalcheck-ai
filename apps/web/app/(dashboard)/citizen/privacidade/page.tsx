import { ArrowLeftIcon, MailIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

/*
  Política de privacidade / LGPD + contato do DPO (T16 · módulo 4).
  Página institucional estática — Server Component, pt-BR, linguagem
  clara. O contato do encarregado é sintético (POC).
*/

export const metadata = {
  title: "Privacidade e LGPD · FiscalCheck AI",
};

export default function PrivacidadePage() {
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
        title="Privacidade e proteção de dados"
        description="Como a Secretaria da Fazenda de Brusque/SC trata seus dados pessoais, conforme a LGPD (Lei nº 13.709/2018)."
      />

      <div className="grid gap-5 rounded-lg border border-border bg-surface p-6 text-sm leading-relaxed text-foreground shadow-[var(--e-1)]">
        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">1. Quais dados tratamos</h2>
          <p>
            Dados cadastrais (CPF/CNPJ, razão social, endereço), dados fiscais (notas fiscais de
            serviço, declarações e valores apurados) e registros das suas interações neste portal
            (protocolos, datas e canal utilizado).
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">2. Por que tratamos</h2>
          <p>
            O tratamento se baseia no cumprimento de obrigação legal e no exercício regular da
            administração tributária municipal (art. 7º, II e art. 23 da LGPD). Seus dados fiscais
            são protegidos também pelo sigilo fiscal do art. 198 do Código Tributário Nacional.
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">3. Com quem compartilhamos</h2>
          <p>
            Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais. O
            acesso interno é restrito por papel (auditores, gestores) e todas as consultas ficam
            registradas em trilha de auditoria imutável.
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">4. Seus direitos</h2>
          <p>
            Você pode solicitar confirmação de tratamento, acesso, correção de dados incompletos ou
            desatualizados e informações sobre o uso dos seus dados (art. 18 da LGPD). Direitos
            relacionados a dados fiscais observam os limites da legislação tributária.
          </p>
        </section>

        <section className="grid gap-2 rounded-lg border border-brand/20 bg-brand-050 p-4">
          <h2 className="text-sm font-semibold text-brand-deep">Encarregado de Dados (DPO)</h2>
          <p className="text-brand-deep">
            Para exercer seus direitos ou tirar dúvidas sobre privacidade, fale com o Encarregado
            pelo Tratamento de Dados Pessoais da Prefeitura de Brusque:
          </p>
          <p className="flex items-center gap-1.5 font-medium text-brand-deep">
            <MailIcon aria-hidden className="size-3.5" />
            dpo@brusque.sc.gov.br (contato de demonstração)
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">5. Ambiente de demonstração</h2>
          <p>
            Esta versão opera como prova de conceito: todos os dados exibidos são sintéticos. Nenhum
            dado pessoal real de contribuinte é tratado neste ambiente.
          </p>
        </section>
      </div>
    </div>
  );
}
