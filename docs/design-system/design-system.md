# FiscalCheck Design System

**FiscalCheck AI — Plataforma de Inteligência Fiscal Agêntica**
Município de Brusque/SC · Secretaria Municipal da Fazenda
Concorrência Presencial nº 013/2026 · Processo licitatório nº 046/2026 (CPSI — LC 182/2021)
Proponente: Beyond / Aurora · Versão 2.0

> **Nomenclatura.** **FiscalCheck AI** é a plataforma. **FiscalCheck Design System** (ou **FiscalCheck DS**) é a linguagem visual descrita neste documento. **Aurora** aparece apenas como nome da **camada Aurora** — superfície e tokens reservados às experiências de IA (ver §3.2). **Beyond / Aurora** é o proponente. Os quatro conceitos são distintos e não devem ser confundidos.
>
> **O que mudou na v2.0.** Esta versão consolida os ajustes validados no protótipo de alta fidelidade: (a) **Raleway** passa a ser a face primária de UI (a Rawline deixa de ser referida como face de produção); (b) entra a **Montserrat** como face de *display numérico* — KPIs, scores e valores de destaque; (c) a **Roboto Mono** fica restrita a identificadores, competências e dados tabulares miúdos; (d) a escala tipográfica foi recalibrada para densidade de painel (títulos e labels menores, pesos mais firmes); (e) componentes revisados — KPI card, tabela de casos (score-chip + tag de origem), navegação lateral agrupada, botão Copilot com gradiente animado; (f) novos padrões de domínio — Próxima melhor ação, Análise de Redes, barra de fluxo agêntico e recorte mobile do cidadão. Ver §12 (changelog). Cores, espaçamento, raios e elevação permanecem os da v1.0.

---

## 1. Visão geral

O **FiscalCheck Design System** é a linguagem visual do **FiscalCheck AI**. Ele dá forma a um produto que vive em duas frentes ao mesmo tempo: telas densas de dados para **auditores e gestores** (scoring de risco, gestão de casos, grafos, copiloto, monitoramento contínuo) e um **canal de autorregularização para o cidadão**, em linguagem clara e acessível.

O sistema combina **referências externas reconhecidas** (entre elas o Padrão Digital de Governo — gov.br DS — e boas práticas de design para serviços públicos) com **construções originais do time**, especialmente nas camadas que tratam de inteligência artificial, dados em tempo real e decisão (a **camada Aurora**, §3.2).

### Referências consideradas

- **gov.br Design System** — observado pela familiaridade que oferece ao servidor público e ao cidadão, pela maturidade em acessibilidade (WCAG, contraste, foco) e pelo alinhamento institucional com serviços da União.
- **Boas práticas de design para serviços públicos** (US Web Design System, GOV.UK Design System, NHS DS) — referências para padrões de notificação, formulários extensos e linguagem orientadora.
- **Sistemas de produto orientados a dados densos** (referências internas do time em painéis fiscais e financeiros) — para tabelas, dossiês, medidores de risco e fluxos agênticos.
- **Construção original** — paleta de risco semântica, camada Aurora para IA, padrões de "esteira de agentes", explicabilidade em linha e o tom de voz human-in-the-loop são contribuições próprias deste sistema.

---

## 2. Princípios

O produto carrega peso legal (sigilo fiscal, art. 198 do CTN; decisões defensáveis perante órgãos de controle) e, ao mesmo tempo, opera 24/7 com agentes de IA. A linguagem concilia essas forças em três princípios.

**Sério.** Azul institucional brasileiro, tipografia Raleway e hierarquia sóbria. Toda classificação de risco é rastreável e explicável — a interface comunica transparência, não opacidade algorítmica.

**Moderno.** Superfícies com elevação suave, raios generosos e a camada Aurora (gradiente azul→ciano) reservada exclusivamente à inteligência: copiloto, agentes e monitoramento.

**Fluido.** Movimento curto e intencional conduz o olhar pelo ciclo **dado → risco → ação**. Nada de efeito gratuito; a animação serve ao fluxo agêntico e respeita `prefers-reduced-motion`.

### Padrão transversal: human-in-the-loop

Reflete diretamente os requisitos (RF04, FA04, FA05) e a regra de que *os agentes preparam, recomendam e instruem; a decisão permanece com o servidor*:

- Toda ação com efeito sobre o contribuinte é apresentada como **recomendação que exige aprovação explícita** do auditor.
- Botões de efeito jurídico usam o **azul primário sólido**; o agente nunca "decide" sozinho na tela.
- Saídas de IA carregam a **camada Aurora** e rótulo de origem (`Detectado por agente`, `Fundamentado em N fontes`), nunca disfarçadas de fato consumado.

---

## 3. Cor

Uma âncora institucional, uma camada de inteligência usada com parcimônia e um espectro de risco que é o coração semântico do produto. *(Sem alterações em relação à v1.0.)*

### 3.1 Marca institucional

Paleta institucional do FiscalCheck AI. Os valores foram calibrados a partir do azul público brasileiro (referenciado no gov.br DS) com ajustes próprios para os contextos de auditoria, scoring e fluxos agênticos.

| Token | Hex | Uso |
| --- | --- | --- |
| `--c-brand-darkest` | `#071D41` | Fundos escuros, cabeçalhos, barra de navegação lateral |
| `--c-brand-deep` | `#0C326F` | Superfícies escuras secundárias, valores de destaque |
| `--c-brand` | `#1351B4` | **Primário / interativo** — ações de efeito jurídico, links |
| `--c-brand-hover` | `#103F8C` | Estado *hover* do primário |
| `--c-brand-300` | `#5B8DEF` | Realce claro, foco, ilustração; base do estado ativo da navegação |
| `--c-brand-100` | `#C5D4F0` | Bordas de realce, fundos de destaque |
| `--c-brand-050` | `#EAF1FB` | Fundos sutis, *hover* de linhas de tabela |

### 3.2 Camada Aurora — inteligência (uso restrito)

Reservada para recursos de IA: Copilot Fiscal, esteira de agentes, monitoramento contínuo (CTC), indicadores "ao vivo".

| Token | Valor | Uso |
| --- | --- | --- |
| `--grad-aurora` | `linear-gradient(100deg, #1351B4 0%, #2D8FE0 52%, #19D3E8 100%)` | Superfícies e botões de IA |
| `--c-aurora` | `#0EA5C4` | Texto/borda de *tags* de IA, ícones de agente |
| `--c-aurora-to` | `#19D3E8` | Ciano luminoso, indicadores ao vivo |

Aplicações consolidadas na v2.0:

- **Avatares e ícones de agente** usam a variante compacta `linear-gradient(135deg, #1351B4, #19D3E8)` em tiles quadrados de raio 8–13 px.
- **Botão Copilot** (barra superior) usa o gradiente Aurora **animado** — `background-size: 200% 100%` com deslocamento contínuo de posição (ver §6). É o único elemento com gradiente em movimento na interface.
- **Tag de origem `AGENTE`** — microtag ciano (`#0EA5C4` sobre `#E6F7FB`) que acompanha registros produzidos por agentes em tabelas e evidências.

> Regra de restrição: a camada Aurora **não** substitui o azul institucional em ações fiscais. Ela sinaliza "isto foi produzido ou assistido por IA".

### 3.3 Espectro de risco — assinatura semântica

O elemento que define a identidade do produto. Não é decoração: é a codificação visual da saída central da plataforma (o **score de risco**, RF03). Aplica-se ao medidor de score, às filas, às tabelas e aos dossiês.

| Nível | Cor | Hex | Fundo do *tag* |
| --- | --- | --- | --- |
| Conforme | verde | `#168821` | `#E3F5E4` |
| Baixo | verde-amarelo | `#7FB23C` | `#EFF6DF` |
| Médio | âmbar | `#F2A900` | `#FFF3D6` |
| Alto | laranja | `#E8590C` | `#FCE6D8` |
| Crítico | vermelho | `#C5160B` | `#FBE0DD` |

Gradiente contínuo (medidor de score):
`linear-gradient(90deg, #168821 0%, #7FB23C 28%, #F2A900 56%, #E8590C 80%, #C5160B 100%)`

Texto sobre os fundos de *tag* usa tons escurecidos por nível para garantir contraste: `#0F5E18` (conforme), `#4F7016` (baixo), `#9A7700` (médio), `#B5430A` (alto), `#C5160B` (crítico).

### 3.4 Semânticas

Cores de feedback de estado. Os hex seguem convenções comuns no setor público brasileiro (alinhadas, entre outras, ao gov.br DS) por familiaridade do usuário final.

| Token | Hex | Fundo |
| --- | --- | --- |
| `--c-success` | `#168821` | `#E3F5E4` |
| `--c-warning` | `#FFCD07` | `#FFF6D6` |
| `--c-danger` | `#E52207` | `#FBE3DF` |
| `--c-info` | `#155BCB` | `#E6EEFB` |

> O amarelo `#FFCD07` não atinge contraste suficiente para texto sobre branco. Use-o como preenchimento com texto escuro, ou empregue o tom escurecido `#9A7700` para texto/ícone de alerta.

### 3.5 Neutros

Cinza de temperatura fria-equilibrada — mais moderno que o cinza plano padrão, mantendo sobriedade.

| Token | Hex | | Token | Hex |
| --- | --- | --- | --- | --- |
| `--n-0` | `#FFFFFF` | | `--n-400` | `#8B97AC` |
| `--n-25` | `#F7F9FC` | | `--n-500` | `#66718A` |
| `--n-50` | `#F1F4F9` | | `--n-600` | `#54607A` |
| `--n-100` | `#E6EAF2` | | `--n-700` | `#333D52` |
| `--n-200` | `#D3DAE6` | | `--n-800` | `#1F2737` |
| `--n-300` | `#B4BECE` | | `--n-900` | `#121826` |

Texto: `--t-strong #121826` · `--t-default #1F2737` · `--t-muted #54607A` · `--t-on-brand #FFFFFF`
Superfície e fundo: `--surface #FFFFFF` · `--app-bg #F4F6FB` · `--border #E1E6F0`

---

## 4. Tipografia

**Revisada na v2.0.** O sistema passa de dois para **três papéis tipográficos**:

| Papel | Família | Observação |
| --- | --- | --- |
| UI / títulos / corpo | **Raleway** | Face primária de produção (400–800). Substitui a Rawline como face de referência; geometria próxima, ampla disponibilidade e mesmos pesos |
| Display numérico — KPIs, scores, valores de destaque | **Montserrat** | 600/700/800. Numerais largos e estáveis dão presença aos valores monetários e ao score sem recorrer à mono |
| Identificadores e dados tabulares | **Roboto Mono** | 400–700. Restrita a IDs de caso, CNPJ, competências, protocolos, contadores e valores em linhas de tabela — onde o alinhamento tabular importa |

Pilha de fontes:

```css
--font-ui: "Raleway",system-ui,-apple-system,"Segoe UI",sans-serif;
--font-display: "Montserrat","Raleway",sans-serif;
--font-data: "Roboto Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
```

> **Divisão de trabalho numérica.** Na v1.0 todos os números de destaque eram Roboto Mono. Na v2.0, **números grandes são Montserrat** (KPI, medidor, valores hero) e a **mono fica nos números pequenos e identificadores** (células de tabela, CNPJ, metas, contadores de navegação). O contraste entre as duas faces passou a fazer parte da assinatura visual dos painéis.

Escala de tipos (recalibrada para densidade de painel):

| Estilo | Fonte | Tamanho | Peso | Uso |
| --- | --- | --- | --- | --- |
| H1 — título de página | Raleway | 30 px | 800 | Título das telas (tracking −0,5 px); 28 px em páginas de detalhe (dossiê) |
| H2 — título de destaque | Raleway | 17–18 px | 800 | Cabeçalhos de superfícies maiores (Copilot, portal do cidadão) |
| H3 — título de card | Raleway | 16–17 px | 700 | Títulos de card / bloco |
| Corpo | Raleway | 13–13,5 px | 500 | Texto padrão de painéis; 1.45–1.6 de entrelinha |
| Apoio / kicker | Raleway | 12,5–13 px | 600 | Linha de contexto acima do H1, subtítulos de card |
| Label | Raleway | 10,5–11 px | 700 | Rótulos, cabeçalhos de tabela — maiúsculas, *tracking* 0,06 em |
| Valor hero | Montserrat | 35–48 px | 800 | Score do medidor (48), valor a regularizar (35); tracking −0,5 a −1,5 px |
| Valor KPI | Montserrat | 25 px | 700 | Cards de indicador |
| Valor secundário | Montserrat | 19–22 px | 700 | Contagens por nível de risco, métricas de rede, evidências |
| Dado tabular | Roboto Mono | 11–15 px | 600–700 | IDs, CNPJ, valores em tabela, score-chip (15), metas, protocolos |

> As faces são servidas via Google Fonts (Raleway 400–800 · Montserrat 600–800 · Roboto Mono 400–700). A Rawline permanece aceitável como equivalente institucional da Raleway em contextos gov.br, mas o documento e o protótipo referenciam a Raleway como face canônica.

---

## 5. Espaçamento, raio e elevação

*(Sem alterações de token em relação à v1.0.)*

**Espaçamento** — base de 4 px:
`--s-1 4` · `--s-2 8` · `--s-3 12` · `--s-4 16` · `--s-5 20` · `--s-6 24` · `--s-8 32` · `--s-10 40` · `--s-12 48` · `--s-16 64`

**Raio:**
`--r-sm 6px` (campos) · `--r-md 10px` (avisos, tabelas internas, itens de navegação, tiles de ícone) · `--r-lg 16px` (cards, modais) · `--r-pill 999px` (botões e *tags*)

Uso consolidado na v2.0: cards de painel usam `--r-lg` uniformemente; itens da navegação lateral e tiles de ícone usam `--r-md`; superfícies maiores (Copilot, portal do cidadão) podem chegar a 18–20 px.

**Elevação** (três níveis, sombras suaves de tom azulado):

```css
--e-1: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.07);
--e-2: 0 6px 16px -4px rgba(16,24,40,.10), 0 2px 6px rgba(16,24,40,.06);
--e-3: 0 18px 42px -12px rgba(13,42,92,.26);
```

Cards de painel repousam em `--e-1`; superfícies de interação destacada (Próxima melhor ação, Copilot, portal do cidadão) em `--e-2`; o *hover* de cards de agente e superfícies escuras usam `--e-3`.

---

## 6. Movimento

```css
--ease: cubic-bezier(.22,.61,.36,1);   /* "fluida" */
--dur-fast: 140ms;  --dur: 220ms;  --dur-slow: 360ms;
```

Diretrizes: *hover* de cards e botões em `--dur-fast`; revelações e transições de estado em `--dur`; sequência de entrada do medidor de score em `--dur-slow`.

Padrões de movimento consolidados na v2.0:

- **Pulso "ao vivo"** — pontos de status ciano (`fc-pulse`, 2 s) e verde (`fc-pulse-green`, 2,4 s), anel de sombra que expande e some. Usado em indicadores de agente ativo e status operacional.
- **Fluxo Aurora** — deslocamento contínuo do gradiente (`background-position`, ciclo de 6 s, linear) exclusivo do botão Copilot na barra superior. Nenhum outro elemento anima gradiente.
- **Elevação no hover** — cards de agente sobem 3 px e trocam `--e-1` → `--e-3` em `--dur-fast`.
- **Entrada** — revelações usam deslocamento vertical de 8 px com fade (`fc-rise`).

**Todo movimento é suprimido sob `prefers-reduced-motion: reduce`.**

---

## 7. Componentes

### Navegação lateral (novo na v2.0)

Barra fixa de **252 px** sobre gradiente escuro vertical (`#071D41 → #0A2552`). Estrutura:

- **Logotipo** — tile 38 px com gradiente Aurora 135°, nome do produto em Raleway 800 e tagline em caps 9 px.
- **Grupos rotulados** — `OPERAÇÃO`, `INTELIGÊNCIA`, `CIDADÃO`; rótulo em caps 10 px / 700 / tracking 0,1 em, cor `#5E78A8`. O grupo Inteligência carrega ponto ciano pulsante.
- **Item de navegação** — 13,5 px / 600, raio `--r-md`, ícone de traço 18 px. Estado ativo: fundo `rgba(91,141,239,.20)` + anel interno sutil + texto branco; inativo: texto `#A9BBDA`. Contadores em Roboto Mono 11 px em pílula translúcida.
- **Cartão do usuário** ancorado ao rodapé, sobre superfície translúcida.

### Barra superior (novo na v2.0)

62 px, branca, borda inferior `--border`. Contém: indicador institucional com ponto verde pulsante, busca em pílula (`--n-50`), sino de notificação com ponto laranja e o **botão Copilot** — pílula com gradiente Aurora animado (ver §6), sempre disponível em qualquer tela.

### Botões

Formato pílula, alturas 40–42 px, rótulo Raleway 13 px / 700–800. Variantes:

- **Primário** (`--c-brand` sólido, peso 800, sombra azulada suave) — ações de efeito jurídico, exigem decisão do auditor.
- **Secundário** (contorno `--c-brand-100`, texto azul, peso 700) e **Ghost** (texto azul) — ações de apoio.
- **Aurora** (gradiente) — exclusivo de recursos de IA; a variante animada é restrita ao acesso ao Copilot.
- **Perigo** (`--c-danger`) — descartes e ações destrutivas.
- **Ação em card** (novo) — botão-cartão com tile de ícone colorido 36 px + título 14 px / 700 + descrição 12 px; usado nas ações do cidadão.

Foco visível obrigatório: `outline: 3px solid --c-brand-300; offset 2px`.

### Campos

Borda `--n-300`, raio `--r-sm`; foco com borda `--c-brand` e halo `--c-brand-050`. Texto de apoio para alertar sobre acesso a dado identificável (autenticação/RBAC). O campo do Copilot usa variante em pílula larga (raio 14 px) com botão de envio embutido.

### Filtros em chip (novo na v2.0)

Fila de pílulas 12 px / 600–700 acima de tabelas: estado selecionado em `--c-brand` sólido, demais em branco com borda `--border` e ponto colorido pelo nível de risco. Inclui o chip `Detectado por agente` com tile gradiente Aurora.

### Tags de risco e status

Pílulas com ponto colorido, 11 px / 700. Cinco níveis de risco (§3.3, com texto nos tons escurecidos por nível) + status operacionais (`Aguardando aprovação`, `Em análise`, `Autorregularização`, `Intimado`, `Monitorado`, `Conforme`). A **microtag `AGENTE`** (9,5–10 px, ciano sobre `#E6F7FB`) marca a origem agêntica em linhas de tabela e evidências.

### Avisos (notice)

Tons semânticos com borda lateral de 4 px, raio `--r-md`, tag de categoria em caps + carimbo de tempo. Voz da interface: direta, sem desculpas, sempre indicando o que fazer (ex.: "Prazo de ciência em 3 dias").

### KPI cards (layout revisado na v2.0)

Nova anatomia, de cima para baixo: **rótulo em label caps** (11 px / 700) à esquerda com **tile de ícone tingido** (30 px, cor semântica a 10 %) à direita; **valor em Montserrat 25 px / 700**; linha de rodapé com **pílula de tendência** (Roboto Mono 12 px sobre fundo semântico) + texto de apoio 12 px. Raio `--r-lg`, elevação `--e-1`. Indicadores do RF05: recuperado, casos abertos, potencial recuperável, acurácia.

### Tabela de casos (layout revisado na v2.0)

Grade fixa por colunas (caso · contribuinte · score · risco · divergência · status). Cabeçalho em label caps 10,5 px sobre `--n-25`; linhas com *hover* `--c-brand-050`; ID do caso em Roboto Mono azul; contribuinte em duas linhas (nome 13,5 px / 700 + CNPJ mono e setor, com microtag `AGENTE` quando aplicável). O score aparece como **score-chip**: retângulo 42×30 px de raio 8 px, fundo do nível de risco e numeral Roboto Mono 15 px / 700 — separado da pílula de nível, que traz o rótulo textual. Valores monetários em Roboto Mono; chevron de acesso ao dossiê ao fim da linha.

### Estados transversais — vazio, carregamento, erro e toast (T25)

Camada obrigatória em toda tela que consuma dados. Padroniza o que antes ficava espalhado por página em `if/else` inline. Referência de implementação em `apps/web/components/ui/{skeleton,empty-state,error-state,async-boundary}.tsx` e `apps/web/lib/{errors,toast}.ts`.

- **Empty state** — bloco central com **ícone Lucide 24 px** em tile 48 px `bg-brand-050`/`text-brand`, título 16 px / 700 e descrição 14 px em `text-muted-foreground`, tudo sobre borda tracejada `--border` e fundo `bg-surface/60` com raio `--r-lg`. Slot opcional de ação (`Button` variante `outline`/`brand`). Variantes de conteúdo: **lista vazia** (nada foi criado), **busca sem resultado** (ajustar filtro) e **sem permissão** (sinaliza RBAC — o texto orienta a pedir acesso, não expõe o role).
- **Skeleton** — retângulo `bg-n-100` com pulso Tailwind, raio `--r-sm`. Wrappers reutilizáveis: `Skeleton` base, `SkeletonText` (N linhas), `SkeletonCard` (mesmo raio/elevação de um card real) e `SkeletonTable` (linhas + colunas do futuro conteúdo, para evitar *layout shift*). Movimento respeita `prefers-reduced-motion` via regra global do §6.
- **Error state** — bloco centralizado com ícone `AlertTriangleIcon`, borda `border-destructive/40`, fundo `bg-destructive/5` e **botão “Tentar novamente”** (variante `outline`). Título e descrição vêm sempre do mapa único `resolveErrorMessage` (§9) — nunca `error.message` cru. Quando há `ApiError.correlationId`, os últimos 12 caracteres aparecem em mono discreto para o usuário reportar ao suporte.
- **AsyncBoundary** — componente que recebe `{ isLoading, isError, isEmpty, error, onRetry, loading, empty, errorSlot, children }` e resolve a precedência **loading > error > empty > success**. É a interface canônica para consumir queries do TanStack — as telas param de repetir três blocos condicionais.
- **Toast (sonner)** — `Toaster` do `sonner` fica no root (`components/ui/sonner.tsx`), estilizado via tokens (`--c-success`, `--c-warning`, `--c-danger`, `--c-info`). Quatro tipos suportados (`success`, `warning`, `error`, `info`), fila com auto-dismiss, botão de fechar e `role=status`/`role=alert` + `aria-live` nativos. Consumo padrão: `notify.success/warning/error/info` e `notify.apiError(error)` do módulo `lib/toast.ts` (nunca `toast.error(error.message)` direto).

**Regras de uso**

- Toda tela com query passa por `AsyncBoundary`. Nenhuma tela em branco.
- Toda ação de escrita (salvar, aprovar, exportar, enviar) retorna toast — sucesso ou erro. Mutations com `meta.toastSuccess = "..."` disparam sucesso automaticamente.
- Erros de leitura viram toast só quando a query **não** sinaliza `meta.silent = true`. Telas que já mostram `ErrorState` inline com `retry` devem marcar `silent` para evitar toast duplicado.
- **Nunca** exibir stack, path, código HTTP cru ou mensagem técnica ao usuário. Todo texto passa por `resolveErrorMessage`.

---

## 8. Padrões de domínio

### Medidor de score (assinatura)

Semicírculo com o gradiente de risco contínuo (traço 22 px, pontas arredondadas), trilha neutra por baixo, ponteiro com pivô escuro e ponta colorida pelo nível. **Número central em Montserrat 48 px / 800** na cor do nível (na v1.0 era mono), legenda "de 100 · prioridade" e extremos da escala em Roboto Mono 10 px. Entrada animada (suprimível). É o objeto visual mais memorável do sistema.

### Próxima melhor ação (novo na v2.0)

Card de recomendação human-in-the-loop no dossiê: **cabeçalho com gradiente Aurora** (rótulo "Próxima melhor ação · recomendada pelo Agente Orquestrador"), corpo com ação proposta e justificativa, e par de botões **Aprovar e emitir** (primário sólido) / **Ajustar** (secundário). Rodapé fixo: *"O agente recomenda e instrui · a decisão é sempre do auditor"* com ícone de cadeado.

### Esteira de agentes (24/7)

Cards de agente com **avatar em tile gradiente Aurora 135°** (42 px), nome 14 px / 700, papel/módulo 11 px, código FA em mono discreto; **faixa de estado** sobre `--n-25` com ponto pulsante (verde = ativo, cinza = ocioso) e métrica em mono; linha de atividade atual com ícone de relógio. *Hover* eleva o card (§6). Precedidos pela **barra de fluxo agêntico** — pílulas encadeadas por setas (Ingestão → Cruzamento & Redes → Score de risco → Orquestração → **Decisão do auditor**, esta em azul sólido com ícone de pessoa). No painel gerencial, versão compacta sobre superfície escura com brilho ciano radial.

### Copilot Fiscal

Superfície clara em card elevado (revisão da v2.0 — o fundo escuro ficou restrito a superfícies de recomendação): cabeçalho com avatar Aurora e rótulo permanente *consulta em linguagem natural · não executa ações* (RF10); balões de conversa (usuário em azul sólido à direita, resposta sobre `--app-bg` à esquerda com identificação do Copilot); bloco **"Fundamentado em N fontes"** com as fontes em chips; campo de pergunta em pílula com sugestões em chips. Rodapé externo reforça: o Copilot consulta e fundamenta, a ação fiscal depende do auditor.

### Análise de Redes (novo na v2.0)

Tela de graph analytics: barra de contexto (comunidade, período, tipos de vínculo, profundidade), faixa de seis métricas com valores em Montserrat, e **canvas do grafo** — nós circulares coloridos por tipo de entidade (PJ, sócio, endereço, fornecedor) e dimensionados pelo score, arestas por tipo de vínculo (societário sólido azul, endereço tracejado cinza, financeiro âmbar), legenda completa no rodapé. Painel lateral com **padrões detectados** (notices com borda de risco) e card escuro de **recomendação do agente**.

### Canal do cidadão (autorregularização)

Card institucional sóbrio com cabeçalho escuro da prefeitura, linguagem clara e acolhedora. **Valor em destaque em Montserrat 35 px / 800**, indicador de passos (feito → atual → futuro), prazo de ciência e protocolo, e grade de **botões-cartão** (`Simular parcelamento`, `Emitir guia`, `Contestar ou esclarecer`, `Agendar atendimento`). Acompanha o **recorte mobile** (novo na v2.0): moldura de aparelho com a mesma hierarquia condensada, alvos de toque ≥ 44 px. Atende ao RF07. Tom de voz: orientador, nunca punitivo.

---

## 9. Acessibilidade e conformidade

- Alvo **WCAG 2.1 AA**: contraste mínimo 4,5:1 para texto; foco visível em todos os interativos.
- Risco e status nunca dependem só de cor — sempre acompanhados de rótulo textual (≈4,5% da população tem alguma insensibilidade cromática). Texto sobre fundos de risco usa os tons escurecidos por nível (§3.3).
- `prefers-reduced-motion` respeitado em todo movimento, incluindo pulsos e o fluxo Aurora.
- Interface em **português do Brasil**, baixa curva de aprendizado (RNF03).
- Alvos de toque ≥ 44 px no recorte mobile do cidadão.
- Navegação por teclado e suporte a leitores de tela seguem as melhores práticas de serviços públicos (entre as referências, gov.br DS, GOV.UK DS, USWDS).

---

## 10. Tokens (CSS) — pronto para uso

```css
:root{
  /* Marca institucional */
  --c-brand-darkest:#071D41; --c-brand-deep:#0C326F; --c-brand:#1351B4;
  --c-brand-hover:#103F8C; --c-brand-300:#5B8DEF; --c-brand-100:#C5D4F0; --c-brand-050:#EAF1FB;
  /* Camada Aurora (IA) */
  --c-aurora:#0EA5C4; --c-aurora-from:#1351B4; --c-aurora-mid:#2D8FE0; --c-aurora-to:#19D3E8;
  --grad-aurora:linear-gradient(100deg,#1351B4 0%,#2D8FE0 52%,#19D3E8 100%);
  --grad-aurora-tile:linear-gradient(135deg,#1351B4 0%,#19D3E8 110%);
  /* Espectro de risco */
  --c-risk-1:#168821; --c-risk-2:#7FB23C; --c-risk-3:#F2A900; --c-risk-4:#E8590C; --c-risk-5:#C5160B;
  --grad-risk:linear-gradient(90deg,#168821 0%,#7FB23C 28%,#F2A900 56%,#E8590C 80%,#C5160B 100%);
  /* Texto sobre fundos de risco */
  --c-risk-1-txt:#0F5E18; --c-risk-2-txt:#4F7016; --c-risk-3-txt:#9A7700;
  --c-risk-4-txt:#B5430A; --c-risk-5-txt:#C5160B;
  /* Semânticas */
  --c-success:#168821; --c-warning:#FFCD07; --c-danger:#E52207; --c-info:#155BCB;
  /* Neutros */
  --n-0:#FFFFFF; --n-25:#F7F9FC; --n-50:#F1F4F9; --n-100:#E6EAF2; --n-200:#D3DAE6;
  --n-300:#B4BECE; --n-400:#8B97AC; --n-500:#66718A; --n-600:#54607A; --n-700:#333D52;
  --n-800:#1F2737; --n-900:#121826;
  --t-strong:#121826; --t-default:#1F2737; --t-muted:#54607A; --t-on-brand:#FFFFFF;
  --surface:#FFFFFF; --app-bg:#F4F6FB; --border:#E1E6F0;
  /* Tipografia (v2.0) */
  --font-ui:"Raleway",system-ui,-apple-system,"Segoe UI",sans-serif;
  --font-display:"Montserrat","Raleway",sans-serif;
  --font-data:"Roboto Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
  /* Espaçamento */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px;
  --s-6:24px; --s-8:32px; --s-10:40px; --s-12:48px; --s-16:64px;
  /* Raio */
  --r-sm:6px; --r-md:10px; --r-lg:16px; --r-pill:999px;
  /* Elevação */
  --e-1:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.07);
  --e-2:0 6px 16px -4px rgba(16,24,40,.10),0 2px 6px rgba(16,24,40,.06);
  --e-3:0 18px 42px -12px rgba(13,42,92,.26);
  /* Movimento */
  --ease:cubic-bezier(.22,.61,.36,1);
  --dur-fast:140ms; --dur:220ms; --dur-slow:360ms;
}
```

---

## 11. Governança

- **Versionamento semântico** do sistema (atual: v2.0). Mudanças de token são *breaking* e exigem nova *major* — a troca da pilha tipográfica nesta versão é o que justifica o salto 1.0 → 2.0.
- Mudanças normativas devem ser absorvidas por **configuração de tokens**, sem refatoração de componentes (alinhado ao RNF05 — manutenção evolutiva).
- Componentes do FiscalCheck DS são mantidos neste documento; quando uma referência externa atualizar um padrão que afete o sistema (ex.: gov.br DS), a equipe avalia caso a caso a incorporação.
- **Referências analisadas durante a construção** (não-exaustivo): gov.br Design System (UI Kit e *dashboard* administrativo), GOV.UK Design System, US Web Design System, NHS Design System, sistemas internos do time em produtos fiscais e financeiros, e boas práticas de sistemas de design para serviços públicos.
- **Construções originais** que pertencem ao FiscalCheck DS e não derivam de nenhum sistema externo: a paleta semântica de risco (§3.3), a camada Aurora para IA (§3.2), o medidor de score (§8), a esteira de agentes (§8) e o padrão Próxima melhor ação (§8).

---

## 12. Changelog — v1.0 → v2.0

**Tipografia**

- Face primária de UI: Rawline → **Raleway** (canônica; Rawline aceita como equivalente institucional).
- Nova face de **display numérico: Montserrat** (600/700/800) para KPIs, scores e valores hero — na v1.0 esses números eram Roboto Mono.
- **Roboto Mono** restrita a identificadores (IDs, CNPJ, protocolos, competências), valores em linhas de tabela e contadores.
- Escala recalibrada: H1 32 → **30 px** (28 px em detalhe); título de card 19 → **16–17 px**; label 13 px/600 → **10,5–11 px/700** caps; corpo de painel 16 → **13–13,5 px/500**; valor KPI passa a **Montserrat 25/700**; score do medidor **Montserrat 48/800**.

**Componentes**

- **KPI card**: nova anatomia (label caps + tile de ícone tingido, valor Montserrat, pílula de tendência mono).
- **Tabela de casos**: score vira **score-chip** retangular tingido; microtag **`AGENTE`** de origem; contribuinte em duas linhas.
- **Navegação lateral**: barra escura 252 px com grupos rotulados, estados ativo/inativo e contadores mono (documentada pela primeira vez).
- **Barra superior** com botão **Copilot em gradiente Aurora animado** (único gradiente em movimento).
- **Filtros em chip** e **botões-cartão** adicionados.
- **Copilot Fiscal**: superfície escura → **card claro elevado**.

**Padrões de domínio**

- Novos: **Próxima melhor ação**, **Análise de Redes** (grafo + legenda + padrões detectados), **barra de fluxo agêntico**, **recorte mobile** do canal do cidadão.
- Medidor de score: número central em Montserrat, na cor do nível.

**Sem mudanças**: paletas (§3), espaçamento, raios, elevação (§5) e curvas/durações de movimento (§6 — acrescidos apenas os padrões de pulso, fluxo Aurora e elevação no hover já praticados no protótipo).
