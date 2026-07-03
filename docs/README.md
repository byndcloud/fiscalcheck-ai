# Documentação — FiscalCheck AI

Índice geral da documentação do projeto.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| [`architecture/`](./architecture/) | Visão arquitetural, modelo de dados, diagramas |
| [`adr/`](./adr/) | Architecture Decision Records (decisões auditáveis) |
| [`compliance/`](./compliance/) | LGPD, sigilo fiscal, retenção e incidentes (resumo consolidado para o MVP) |
| [`design-system/`](./design-system/) | Design system (a popular pelo time) |
| [`modules/`](./modules/) | Especificações dos 7 módulos do edital |

## Como navegar

- Começando no projeto: leia [`../README.md`](../README.md) e [`../AGENTS.md`](../AGENTS.md).
- Decisões arquiteturais: comece pelo ADR-0001 em [`adr/0001-stack-inicial.md`](./adr/0001-stack-inicial.md).
- Conformidade: comece por [`compliance/lgpd.md`](./compliance/lgpd.md) e [`compliance/sigilo-fiscal-art-198-ctn.md`](./compliance/sigilo-fiscal-art-198-ctn.md).
- Cada módulo do edital tem seu doc em [`modules/`](./modules/).

## Convenções de docs

- **pt-BR** em prosa; identificadores e blocos de código em inglês.
- Formatação de Markdown é responsabilidade do autor (sem lint automático no MVP).
- **Mermaid** preferencial para diagramas (renderiza nativo no GitHub).
- **ADRs imutáveis após `Accepted`** — para revogar, use status `Superseded by ADR-XXXX`.

## Onde colocar o design system

Coloque o markdown principal em **[`design-system/design-system.md`](./design-system/design-system.md)** (ou divida por seção, ex.: `tokens.md`, `componentes.md`, `acessibilidade.md`). O `README.md` dessa pasta é o índice.
