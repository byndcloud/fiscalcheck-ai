"use client";

import { ActivityIcon, RadarIcon, ScanSearchIcon } from "lucide-react";

import { CtcFeedTab } from "@/components/crossing/ctc-feed-tab";
import { DivergenciasTab } from "@/components/crossing/divergencias-tab";
import { NonFilerTab } from "@/components/crossing/non-filer-tab";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/*
  Detecção e cruzamento (módulo 2) — três frentes do RF02/RF09:
  · Divergências (T05): declarado × NFS-e, caso instruído e auditável;
  · Fora do radar (T06): non-filer discovery com fila priorizada;
  · Monitoramento CTC (T07): feed em quase tempo real com alertas
    antecipados.
*/

export default function CrossingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Detecção e cruzamento"
        description="Divergências declarado × NFS-e, prestadores fora do radar e monitoramento contínuo em quase tempo real. Módulo 2."
      />

      <Tabs defaultValue="divergencias">
        <TabsList>
          <TabsTrigger value="divergencias">
            <ScanSearchIcon aria-hidden="true" className="size-4" />
            Divergências
          </TabsTrigger>
          <TabsTrigger value="fora-do-radar">
            <RadarIcon aria-hidden="true" className="size-4" />
            Fora do radar
          </TabsTrigger>
          <TabsTrigger value="ctc">
            <ActivityIcon aria-hidden="true" className="size-4" />
            Monitoramento CTC
          </TabsTrigger>
        </TabsList>

        <TabsContent value="divergencias">
          <DivergenciasTab />
        </TabsContent>
        <TabsContent value="fora-do-radar">
          <NonFilerTab />
        </TabsContent>
        <TabsContent value="ctc">
          <CtcFeedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
