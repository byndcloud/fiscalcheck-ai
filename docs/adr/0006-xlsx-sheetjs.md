# ADR-0006: Exportação de relatórios gerenciais em XLSX com SheetJS Community

- **Status:** Accepted
- **Data:** 2026-07-04
- **Autor(es):** @owner-frontend
- **Revisores:** @owner-tech-lead, @owner-architect

## Contexto

O aceite do **T17 · Módulo 5** exige exportação dos relatórios gerenciais (Calibragem e Validação) em **PDF/XLSX (mock)**. O PDF já resolvido via [ADR-0004](./0004-pdf-dossie-react-pdf.md) (`@react-pdf/renderer`).

Para o XLSX, a Secretaria da Fazenda do piloto **precisa abrir os dados no Excel** — é o formato usado internamente para conferência cruzada com planilhas legadas. CSV puro atende parcialmente (abre no Excel), mas perde:

- múltiplas abas (uma por seção do relatório: KPIs, metas, SUS, casos críticos);
- formatação de moeda BRL e percentuais;
- congelamento de cabeçalho e larguras de coluna;
- fórmulas simples que o auditor possa manipular.

Restrições:

- LGPD proíbe enviar dados a serviços externos ([AGENTS.md §1.2](../../AGENTS.md)) — a geração precisa ser 100% client-side.
- [CLAUDE.md §6](../../CLAUDE.md) exige ADR para dependência pesada. `xlsx` (SheetJS Community) pesa ~500 KB gzipped — o maior single-dep até hoje no projeto.
- O relatório só é gerado quando o gestor clica no botão — a UI **não pode** carregar o pacote no bundle inicial.

## Decisão

Adotamos **[`xlsx` (SheetJS Community Edition)](https://sheetjs.com/)** como biblioteca oficial de geração de planilhas do FiscalCheck AI, carregada **exclusivamente via dynamic import** dentro de [`apps/web/lib/reports/build-xlsx.ts`](../../apps/web/lib/reports/build-xlsx.ts).

Padrão de uso:

```ts
async function generateXlsxBlob(data: RelatorioGerencialData): Promise<Blob> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  // uma sheet por seção
  XLSX.utils.book_append_sheet(wb, sheetKpis, "KPIs");
  XLSX.utils.book_append_sheet(wb, sheetMetas, "Metas");
  // ...
  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
```

- **Dynamic import** isola o pacote em um chunk próprio: só é baixado quando o auditor clica em "Gerar XLSX" no `ReportGeneratorModal`.
- **Sem `xlsx-style`** — a versão Community já cobre formatos numéricos e larguras. Estilo visual (cores) é acessório e não vale o custo do fork.

## Consequências

### Positivas

- **Formato XLSX real** — abre no Excel/LibreOffice/Google Sheets sem intermediários; mantém múltiplas abas, fórmulas, formatos numéricos BRL/%.
- **Client-side** — nenhum byte de contribuinte deixa o browser do auditor; consistente com o padrão do dossiê PDF.
- **API estável** — SheetJS existe há > 10 anos, mantida (versão Community ativa), documentação boa em pt-BR e en.
- **Chunk isolado** — quem nunca clica em "Gerar XLSX" jamais baixa o pacote (auditores, admin em outras rotas).
- **Cobre `csv`, `xlsx`, `xls`, `ods`** — abre porta futura para exportar em ODS (usado por parte do setor público).

### Negativas / trade-offs

- **~500 KB gzipped** — o maior peso individual do repo. Aceitável **somente por causa do dynamic import**; sob nenhuma hipótese este pacote pode ser importado no topo de arquivos que rodam no bundle inicial.
- **License Apache-2.0** (Community) — compatível com o licenciamento do projeto a definir; se o piloto exigir versão comercial (SheetJS Pro tem estilos), abrimos ADR seguinte.
- **API `XLSX.utils.aoa_to_sheet`** é imperativa (não JSX); os builders em `apps/web/lib/reports/` absorvem esse boilerplate.
- **Sem preview do XLSX no navegador** — o gestor gera e baixa; a prévia do modal mostra apenas a estrutura das seções.

### Riscos

- **Bump de major** de SheetJS pode mudar `bookType` ou `types` de retorno. Mitigação: pin em major fixo + smoke test manual.
- **Import estático acidental** derruba a promessa de bundle isolado. Mitigação: `biome`/eslint rule + review — todo import da lib **precisa** ser `await import("xlsx")` (documentado em `apps/web/lib/reports/README.md`).
- **CDN alternativas para versões futuras** — SheetJS distribui via CDN próprio; usar sempre `npm`/`pnpm` ancorado no lockfile.

## Alternativas consideradas

### A. CSV puro simulando `.xlsx`

- **A favor:** zero dependência, aceita fórmulas simples se aberto no Excel.
- **Contra:** perde múltiplas abas — o relatório de Calibragem tem 4 seções distintas; concatenar tudo em uma única aba destrói a conferência cruzada. **Rejeitada**.

### B. `exceljs`

- **A favor:** API mais moderna, suporte a estilos completos.
- **Contra:** bundle ~700 KB gzipped (maior que SheetJS Community + estilo), lastreado em Node primeiro; no browser exige polyfills que o Next 15 já não fornece. **Rejeitada**.

### C. Server-side com `openpyxl`/`xlsxwriter` (Python)

- **A favor:** zero peso no cliente, geração rica.
- **Contra:** exige backend real, foge do modelo MSW do MVP ([ADR-0003](./0003-preview-replit.md)); reintroduz trânsito de dados sensíveis (contra AGENTS.md §1.2 sem cripto in-transit implementado ainda). **Adiada** — pode ser reavaliada quando o backend do módulo 5 subir.

### D. Não oferecer XLSX

- **A favor:** economia de 500 KB.
- **Contra:** viola o aceite explícito do T17 ("export dos relatórios em mock"). **Rejeitada**.

## Como reverter

- **Cair para CSV:** substituir `build-xlsx.ts` por `build-csv.ts` (~200 linhas com `Papa.unparse` ou string join manual). O `ReportGeneratorModal` continua idêntico, apenas troca o tipo MIME. Custo: 1 dia.
- **Migrar para server-side:** expor `POST /analytics/reports/{tipo}.xlsx` no backend real e substituir o dynamic import por um `fetch` que baixa o binário. Contrato `RelatorioGerencialRequest`/`Response` permanece.

## Referências

- Edital CPSI — Município de Brusque/SC (Anexo I, seção "Monitoramento e Relatórios Gerenciais").
- [SheetJS Community — documentação oficial](https://docs.sheetjs.com/).
- [`xlsx` — bundlephobia](https://bundlephobia.com/package/xlsx).
- [ADR-0004 — geração de PDF](./0004-pdf-dossie-react-pdf.md).
- [ADR-0003 — preview no Replit com MSW](./0003-preview-replit.md).
- [AGENTS.md §1.2 — sigilo fiscal e LGPD](../../AGENTS.md).
