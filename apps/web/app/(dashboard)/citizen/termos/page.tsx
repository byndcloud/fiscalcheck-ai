import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

/*
  Termos de uso do Portal do Contribuinte (T16 · módulo 4).
  Página institucional estática — Server Component, conteúdo em pt-BR
  e linguagem clara (eMAG).
*/

export const metadata = {
  title: "Termos de uso · FiscalCheck AI",
};

export default function TermosPage() {
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
        title="Termos de uso"
        description="Condições de uso do Portal do Contribuinte da Secretaria da Fazenda de Brusque/SC."
      />

      <div className="grid gap-5 rounded-lg border border-border bg-surface p-6 text-sm leading-relaxed text-foreground shadow-[var(--e-1)]">
        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">1. O que é este portal</h2>
          <p>
            O Portal do Contribuinte é o canal digital da Secretaria da Fazenda de Brusque para você
            acompanhar pendências fiscais, entender as divergências identificadas e regularizar sua
            situação — por pagamento, parcelamento ou contestação — sem precisar comparecer ao
            atendimento presencial.
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">2. Quem pode usar</h2>
          <p>
            O próprio contribuinte (pessoa física ou jurídica) e o contador ou procurador por ele
            autorizado. O acesso exige identificação — nenhuma informação fiscal é exibida sem
            login, em respeito ao sigilo fiscal (art. 198 do Código Tributário Nacional).
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">3. Validade das ações</h2>
          <p>
            Toda ação realizada no portal — registro de ciência, adesão a parcelamento, emissão de
            guia, contestação ou agendamento — gera um número de protocolo com data e hora. Guarde
            seus protocolos: eles comprovam a sua manifestação perante a administração municipal.
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">4. Suas responsabilidades</h2>
          <p>
            Manter seus dados cadastrais atualizados, não compartilhar suas credenciais de acesso e
            prestar informações verdadeiras. Declarações falsas podem gerar responsabilização nos
            termos da lei.
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold text-text-strong">5. Ambiente de demonstração</h2>
          <p>
            Esta versão do portal opera em ambiente de demonstração (prova de conceito). Guias,
            protocolos e valores exibidos são sintéticos e não produzem efeitos jurídicos ou
            financeiros.
          </p>
        </section>
      </div>
    </div>
  );
}
