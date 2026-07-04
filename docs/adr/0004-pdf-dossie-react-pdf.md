# ADR-0004: Geração de PDF do dossiê no cliente com `@react-pdf/renderer`

- **Status:** Accepted
- **Data:** 2026-07-03
- **Autor(es):** @owner-frontend
- **Revisores:** @owner-tech-lead, @owner-architect

## Contexto

O edital do CPSI Brusque (Módulo 4) exige que o dossiê do caso seja **exportável como peça processual anexável** (T28). O documento precisa reunir, de forma consistente e reproduzível:

- identificação do contribuinte com CNPJ mascarado (art. 198 CTN + LGPD);
- resumo de divergências e valores;
- score de risco com explicabilidade (fatores XAI);
- evidências (NFS-e);
- linha do tempo (decisões + termos gerados);
- recomendação do agente e decisão do auditor;
- banner de sigilo e marca de "AMBIENTE DE DEMONSTRAÇÃO";
- carimbo com `correlationId` do próprio evento de exportação (rastreável na trilha T19).

Restrições:

- No MVP não há backend real gerando PDF — a UI se apoia em MSW ([ADR-0003](./0003-preview-replit.md)). A geração precisa acontecer 100% client-side.
- O documento é **peça processual** — o layout precisa ser **estável entre browsers** e **fiel ao design system** (Raleway/Montserrat/Roboto Mono, escala de risco, cores institucionais).
- LGPD proíbe enviar dados identificáveis a serviços externos ([AGENTS.md §1.2](../../AGENTS.md)). A geração precisa rodar 100% local no browser do auditor.
- [CLAUDE.md §6](../../CLAUDE.md) exige ADR para adicionar dependência pesada.

## Decisão

Adotamos **[`@react-pdf/renderer`](https://react-pdf.org/)** como biblioteca de geração de PDF do dossiê, carregada via **dynamic import** dentro de `apps/web/lib/dossie/` para não impactar o TTI das demais páginas.

O documento fica em `apps/web/lib/dossie/pdf-document.tsx` (componentes `<Page>`, `<View>`, `<Text>`), orquestrado por `apps/web/lib/dossie/export-dossie.ts` (gera o `Blob`, dispara download via `downloadBlob` já existente em `lib/compliance/export-audit.ts`, e registra o evento na trilha via `POST /cases/:id/dossie/export`).

Os dados são agregados por `apps/web/lib/dossie/build-dossie-data.ts` a partir das queries TanStack já disponíveis (`Caso`, `Contribuinte`, `Score`, `Divergencia[]`, `CaseDecision[]`, `CaseDocument[]`, `NFSe[]`).

## Consequências

### Positivas

- **API declarativa em JSX** — o documento vira componentes React com Flexbox, alinhados ao vocabulário do time e ao design system.
- **Layout previsível** — o motor do `@react-pdf/renderer` roda o mesmo algoritmo em qualquer browser, produzindo o mesmo PDF byte-a-byte (essencial para peça processual).
- **Tipografia oficial** — `Font.register()` carrega Raleway/Montserrat/Roboto Mono a partir do Google Fonts uma única vez por sessão, mantendo a identidade visual v2.0 no PDF.
- **Sem servidor** — nenhum dado sensível deixa o browser do auditor; conformidade com LGPD e sigilo fiscal preservada por construção.
- **Dynamic import** isola o custo — o bundle da lib só é baixado quando o auditor clica em "Exportar PDF", protegendo o TTI das demais rotas.

### Negativas / trade-offs

- **~500 KB gzipped** de bundle dedicado à página do dossiê. Mitigação: dynamic import + splitting Next.js (a lib nunca aparece no bundle da tela de login, do kanban ou de analytics).
- **Motor próprio** (fork de Yoga) — nem toda propriedade CSS existe; layouts complexos exigem pensamento em Flexbox estrito. Aceitável para o formato tabular do dossiê.
- **Fontes remotas** dependem do Google Fonts ficar disponível. Mitigação: cache do browser cobre requests subsequentes; em piloto sem internet, o fallback tipográfico padrão do `@react-pdf/renderer` produz PDF legível.
- **Duplicação parcial de estilos** — cores/spacings são reescritos em objetos JS (o motor não lê tokens CSS). Mitigação: um único mapa de tokens em `pdf-document.tsx` espelhando o DS v2.0.

### Riscos

- **Font.register em ambiente serverless (edge/SSR)** pode falhar. Mitigação: componente/lib ficam sob `"use client"` e o dynamic import só resolve no browser.
- **Atualizações do `@react-pdf/renderer` v3 → v4** podem trazer breaking changes. Mitigação: pin em major fixo + Renovate weekly + smoke test manual sempre que subir.

## Alternativas consideradas

### A. `jsPDF` + `jspdf-autotable`

- **A favor:** bundle menor (~150 KB), muito difundido no setor público brasileiro.
- **Contra:** API imperativa exige posicionamento manual em pontos, o que compromete fidelidade ao DS e complica seções com altura variável (linha do tempo, tabela de fatores XAI). Aumenta risco de regressão visual entre releases. **Rejeitada**.

### B. `window.print()` + `@media print`

- **A favor:** zero dependência.
- **Contra:** resultado varia por browser (paginação, quebras, fontes), não produz arquivo consistente para anexar como peça processual. Serve como fallback de emergência, não como estratégia. **Rejeitada**.

### C. Geração server-side com Puppeteer/Playwright

- **A favor:** máxima fidelidade (Chromium headless renderiza HTML/CSS exato).
- **Contra:** exige backend real (fora de escopo do MVP MSW) e ambiente com Chromium instalado (não trivial no Replit). Vai contra [ADR-0003](./0003-preview-replit.md). **Adiada** — pode ser reavaliada quando o backend real do módulo 4 subir.

## Como reverter

- **Trocar por `jsPDF`:** reescrever `pdf-document.tsx` (~1 dia) e ajustar `export-dossie.ts` (a API de `Blob` é semelhante). O contrato do endpoint MSW (`POST /cases/:id/dossie/export`) e o schema `DossieExport` permanecem.
- **Migrar para server-side (Puppeteer):** expor `POST /cases/:id/dossie/export.pdf` no backend real e substituir a lógica interna do `export-dossie.ts` para apenas baixar a resposta binária. Chamador (`DossieExportButton`) e trilha ficam inalterados.

## Referências

- Edital CPSI — Município de Brusque/SC (Anexo I, seção "Instrução do caso").
- [`@react-pdf/renderer` — docs oficial](https://react-pdf.org/).
- [`Font.register`](https://react-pdf.org/fonts).
- [AGENTS.md §1.2 — sigilo fiscal e LGPD](../../AGENTS.md).
- [ADR-0003 — preview no Replit com MSW](./0003-preview-replit.md).
