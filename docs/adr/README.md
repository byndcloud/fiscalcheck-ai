# Architecture Decision Records (ADRs)

Cada decisão arquitetural relevante vira um ADR numerado. Uma vez `Accepted`, **não é editado**: se for revogado, marque como `Superseded by ADR-XXXX` e crie o novo.

## Como criar um ADR

1. Copie [`template.md`](./template.md) para `XXXX-titulo-curto.md` (próximo número sequencial).
2. Preencha contexto, decisão, consequências, alternativas.
3. Comece com `Status: Proposed`. Após discussão, mude para `Accepted` (ou `Rejected`).
4. Faça PR pedindo revisão do tech lead / arquiteto.

## Índice

| # | Título | Status |
|---|---|---|
| [0001](./0001-stack-inicial.md) | Stack inicial — monorepo pnpm, Next.js 15, FastAPI, PostgreSQL único | Accepted (revisitado em parte por ADR-0002) |
| [0002](./0002-database-mvp-replit.md) | Estratégia de banco para o MVP no Replit — pgvector sim, Apache AGE adiado | Accepted |
| [0003](./0003-preview-replit.md) | Estratégia de preview no Replit — webview web-only com MSW | Proposed |
| [0004](./0004-pdf-dossie-react-pdf.md) | Geração de PDF do dossiê no cliente com `@react-pdf/renderer` | Accepted |

## Padrões de qualidade

- **Pequeno** — uma decisão por ADR.
- **Datado** — cabeçalho com data.
- **Auditável** — referencie evidências (links, benchmarks, citações de edital).
- **Reversível** quando possível — explique como sair caso a decisão se mostre errada.
