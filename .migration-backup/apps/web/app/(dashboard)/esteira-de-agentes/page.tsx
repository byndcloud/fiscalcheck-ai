import type { Metadata } from "next";

import { EsteiraDeAgentesView } from "@/components/agents/esteira-de-agentes-view";

export const metadata: Metadata = {
  title: "Esteira de agentes",
  description: "Observabilidade dos agentes especialistas do FiscalCheck AI (FA01–FA11).",
};

export default function EsteiraDeAgentesPage() {
  return <EsteiraDeAgentesView />;
}
