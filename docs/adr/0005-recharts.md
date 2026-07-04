# ADR-0005: `recharts` como biblioteca de gráficos do Painel do Gestor

- **Status:** Accepted
- **Data:** 2026-07-04
- **Autor(es):** @owner-frontend
- **Revisores:** @owner-tech-lead, @owner-design-system

## Contexto

O edital do CPSI Brusque prevê o **Painel do Gestor com dashboards em tempo real** (RF05 · Módulo 5 · T17). Os aceites da task exigem:

- **gráficos interativos com filtro por período** (30d / 90d / trimestre / ano);
- **KPIs com tendência** (sparkline embutido em cada card);
- **pelo menos 6 KPIs** e drill-down por card;
- consumo por perfil supervisor/admin (mas com performance boa, porque a tela abre logo após login desses papéis).

Restrições do projeto:

- Stack fixa React 19 + Next.js 15 (App Router) + TypeScript estrito ([`00-fiscalcheck-context.md` §1](../../.claude/skills/frontend/references/00-fiscalcheck-context.md)).
- Design System v2.0 fixa paleta institucional (marca, aurora, espectro de risco); a lib de charts precisa aceitar `fill/stroke` arbitrários.
- Zero telemetria externa ([AGENTS.md §1.2](../../AGENTS.md)) — nada de rendering em SaaS.
- [CLAUDE.md §6](../../CLAUDE.md) exige ADR para dependência pesada.

Até o T17, todos os gráficos existentes (`MonthlyRecoveryChart`, `RiskDistributionPanel`) eram feitos em **CSS puro** — barras via `<div>` com `height: N%`. Isso escala mal para: séries de 12+ pontos, sparklines dentro de cards, gráficos de pizza, tooltips e drill-down por clique.

## Decisão

Adotamos **[`recharts`](https://recharts.org/)** como biblioteca oficial de gráficos do FiscalCheck AI (a partir do T17), começando pelo Painel do Gestor.

Escopo de uso:

- **`AreaChart` / `LineChart` / `BarChart`** para séries temporais (recuperação mensal, produtividade por semana).
- **`PieChart`** para distribuição categórica (status de casos, distribuição de risco quando trocarmos o painel atual).
- **`<Sparkline>`** — wrapper fino em [`apps/web/components/analytics/sparkline.tsx`](../../apps/web/components/analytics/sparkline.tsx) sobre `LineChart` para embarcar micro-tendência dentro de `KpiTrendCard`.

Regras de estilo:

- Todas as cores vêm dos tokens em `apps/web/app/globals.css` (`--c-brand`, `--c-risk-*`, `--grad-aurora`) via propriedades JS (a lib não lê CSS custom properties diretamente).
- Não usar temas ou paletas embutidos do `recharts` — a identidade visual precisa continuar sendo do DS v2.0.

## Consequências

### Positivas

- **API declarativa em JSX** — cada gráfico vira `<AreaChart>` com sub-componentes tipados; combina com o padrão RSC/CSC do restante do app.
- **SVG puro** — perfeito para acessibilidade (aria-label por série) e para o `prefers-reduced-motion` (basta desligar `isAnimationActive`).
- **~90 KB gzipped** — cerca de 1/5 do custo do `@react-pdf/renderer`; entra no bundle da rota `/analytics` sem exigir splitting adicional.
- **MIT** — compatível com licenciamento a definir do projeto.
- **Comunidade grande** — mantido pela Alibaba, > 21k estrelas no GitHub, releases mensais.
- **Composable** — dá para plotar sparkline (60x24) usando o mesmo componente que roda o `AreaChart` full-size, sem duplicar código.

### Negativas / trade-offs

- **~90 KB gzipped** de tudo o que a rota `/analytics` carrega (aceitável — só supervisor/admin acessa e é a página onde os gráficos vivem).
- **Dependência transitória de `d3-*`** — bumpa 6 pacotes indiretos. Mitigação: fixamos ranges de major no `package.json` e Renovate weekly.
- **API baseada em children** pode ficar verbosa em gráficos complexos (Cartesian + tooltip + legenda). Mitigação: wrappers em `apps/web/components/analytics/` que absorvem o boilerplate.
- **Interoperabilidade com Tailwind v4** — não é 100% via `className` para elementos internos SVG; precisa de props `fill`/`stroke` explícitos. Aceitável.

### Riscos

- **Server Components + recharts**: a lib usa `ResponsiveContainer` que depende do DOM. Componentes que a usam **precisam** ser `"use client"`. Já é o padrão do projeto para dashboards.
- **Regressão visual entre versões**: os componentes internos podem mudar `defaultProps` entre majors. Mitigação: pin em `^3.x` + smoke test manual quando subir.

## Alternativas consideradas

### A. Manter tudo em CSS puro

- **A favor:** zero dependência, controle total.
- **Contra:** não escala para sparklines em 6+ cards, tooltips complexos e gráficos de pizza. Recomeçar do zero para cada gráfico. **Rejeitada**.

### B. `Chart.js` (com `react-chartjs-2`)

- **A favor:** difundido, bundle ~55 KB gzipped.
- **Contra:** motor **Canvas** — perde acessibilidade nativa e responsividade fluida; sparklines exigem canvas por card, custo agregado alto. **Rejeitada**.

### C. `visx` (Airbnb)

- **A favor:** SVG, muito flexível, mesmo autor de várias primitivas React.
- **Contra:** de baixo nível — cada tipo de gráfico exige composição manual de escalas, eixos, tooltip. Ganho não compensa para o escopo do T17. **Rejeitada** (podemos reavaliar para o módulo de Análise de Redes).

### D. `Nivo`

- **A favor:** SVG, temas ricos.
- **Contra:** módulos por gráfico (`@nivo/line`, `@nivo/pie`), 3–4 deps para cobrir o escopo mínimo; custo agregado > 200 KB. **Rejeitada**.

## Como reverter

- **Trocar por `Chart.js`:** reescrever `Sparkline`, `MonthlyRecoveryChart` (evolução do CSS puro para recharts), `MetaProgressCard` (barra de progresso independente) e os gráficos de pizza — ~2 dias de trabalho. Os wrappers em `apps/web/components/analytics/` isolam o impacto.
- **Voltar para CSS puro:** viável para AreaChart/LineChart de baixa fidelidade; inviável para sparklines em 6+ cards. Seria um retrocesso funcional.

## Referências

- Edital CPSI — Município de Brusque/SC (Anexo I, seção "Monitoramento e Relatórios Gerenciais").
- [`recharts` — documentação oficial](https://recharts.org/en-US/).
- [`recharts` — bundle size no bundlephobia](https://bundlephobia.com/package/recharts).
- [ADR-0004 — geração de PDF](./0004-pdf-dossie-react-pdf.md).
- [`docs/design-system/design-system.md` §3](../design-system/design-system.md).
