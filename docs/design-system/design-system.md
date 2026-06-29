# FiscoCheck Design System

**FiscoCheck AI — Plataforma de Inteligência Fiscal Agêntica**
Município de Brusque/SC · Secretaria Municipal da Fazenda
Concorrência Presencial nº 013/2026 · Processo licitatório nº 046/2026 (CPSI — LC 182/2021)
Proponente: Beyond / Aurora · Versão 1.0

> **Nomenclatura.** **FiscoCheck AI** é a plataforma. **FiscoCheck Design System** (ou **FiscoCheck DS**) é a linguagem visual descrita neste documento. **Aurora** aparece apenas como nome da **camada Aurora** — superfície e tokens reservados às experiências de IA (ver §3.2). **Beyond / Aurora** é o proponente. Os quatro conceitos são distintos e não devem ser confundidos.

---

## 1. Visão geral

O **FiscoCheck Design System** é a linguagem visual do **FiscoCheck AI**. Ele dá forma a um produto que vive em duas frentes ao mesmo tempo: telas densas de dados para **auditores e gestores** (scoring de risco, gestão de casos, grafos, copiloto, monitoramento contínuo) e um **canal de autorregularização para o cidadão**, em linguagem clara e acessível.

O sistema combina **referências externas reconhecidas** (entre elas o Padrão Digital de Governo — gov.br DS — e boas práticas de design para serviços públicos) com **construções originais do time**, especialmente nas camadas que tratam de inteligência artificial, dados em tempo real e decisão (a **camada Aurora**, §3.2).

### Referências consideradas

- **gov.br Design System** — observado pela familiaridade que oferece ao servidor público e ao cidadão, pela maturidade em acessibilidade (WCAG, contraste, foco) e pelo alinhamento institucional com serviços da União.
- **Boas práticas de design para serviços públicos** (US Web Design System, GOV.UK Design System, NHS DS) — referências para padrões de notificação, formulários extensos e linguagem orientadora.
- **Sistemas de produto orientados a dados densos** (referências internas do time em painéis fiscais e financeiros) — para tabelas, dossiês, medidores de risco e fluxos agênticos.
- **Construção original** — paleta de risco semântica, camada Aurora para IA, padrões de "esteira de agentes", explicabilidade em linha e o tom de voz human-in-the-loop são contribuições próprias deste sistema.

---

## 2. Princípios

O produto carrega peso legal (sigilo fiscal, art. 198 do CTN; decisões defensáveis perante órgãos de controle) e, ao mesmo tempo, opera 24/7 com agentes de IA. A linguagem concilia essas forças em três princípios.

**Sério.** Azul institucional brasileiro, tipografia Rawline e hierarquia sóbria. Toda classificação de risco é rastreável e explicável — a interface comunica transparência, não opacidade algorítmica.

**Moderno.** Superfícies com elevação suave, raios generosos e a camada Aurora (gradiente azul→ciano) reservada exclusivamente à inteligência: copiloto, agentes e monitoramento.

**Fluido.** Movimento curto e intencional conduz o olhar pelo ciclo **dado → risco → ação**. Nada de efeito gratuito; a animação serve ao fluxo agêntico e respeita `prefers-reduced-motion`.

### Padrão transversal: human-in-the-loop

Reflete diretamente os requisitos (RF04, FA04, FA05) e a regra de que *os agentes preparam, recomendam e instruem; a decisão permanece com o servidor*:

- Toda ação com efeito sobre o contribuinte é apresentada como **recomendação que exige aprovação explícita** do auditor.
- Botões de efeito jurídico usam o **azul primário sólido**; o agente nunca "decide" sozinho na tela.
- Saídas de IA carregam a **camada Aurora** e rótulo de origem (`Detectado por agente`, `Fundamentado em N fontes`), nunca disfarçadas de fato consumado.

---

## 3. Cor

Uma âncora institucional, uma camada de inteligência usada com parcimônia e um espectro de risco que é o coração semântico do produto.

### 3.1 Marca institucional

Paleta institucional do FiscoCheck AI. Os valores foram calibrados a partir do azul público brasileiro (referenciado no gov.br DS) com ajustes próprios para os contextos de auditoria, scoring e fluxos agênticos.

| Token | Hex | Uso |
|---|---|---|
| `--c-brand-darkest` | `#071D41` | Fundos escuros, cabeçalhos, barra de navegação lateral |
| `--c-brand-deep` | `#0C326F` | Superfícies escuras secundárias, valores de destaque |
| `--c-brand` | `#1351B4` | **Primário / interativo** — ações de efeito jurídico, links |
| `--c-brand-hover` | `#103F8C` | Estado *hover* do primário |
| `--c-brand-300` | `#5B8DEF` | Realce claro, foco, ilustração |
| `--c-brand-100` | `#C5D4F0` | Bordas de realce, fundos de destaque |
| `--c-brand-050` | `#EAF1FB` | Fundos sutis, *hover* de linhas de tabela |

### 3.2 Camada Aurora — inteligência (uso restrito)

Reservada para recursos de IA: Copilot Fiscal, esteira de agentes, monitoramento contínuo (CTC), indicadores "ao vivo".

| Token | Valor | Uso |
|---|---|---|
| `--grad-aurora` | `linear-gradient(100deg, #1351B4 0%, #2D8FE0 52%, #19D3E8 100%)` | Superfícies e botões de IA |
| `--c-aurora` | `#0EA5C4` | Texto/borda de *tags* de IA, ícones de agente |
| `--c-aurora-to` | `#19D3E8` | Ciano luminoso, indicadores ao vivo |

> Regra de restrição: a camada Aurora **não** substitui o azul institucional em ações fiscais. Ela sinaliza "isto foi produzido ou assistido por IA".

### 3.3 Espectro de risco — assinatura semântica

O elemento que define a identidade do produto. Não é decoração: é a codificação visual da saída central da plataforma (o **score de risco**, RF03). Aplica-se ao medidor de score, às filas, às tabelas e aos dossiês.

| Nível | Cor | Hex | Fundo do *tag* |
|---|---|---|---|
| Conforme | verde | `#168821` | `#E3F5E4` |
| Baixo | verde-amarelo | `#7FB23C` | `#EFF6DF` |
| Médio | âmbar | `#F2A900` | `#FFF3D6` |
| Alto | laranja | `#E8590C` | `#FCE6D8` |
| Crítico | vermelho | `#C5160B` | `#FBE0DD` |

Gradiente contínuo (medidor de score):
`linear-gradient(90deg, #168821 0%, #7FB23C 28%, #F2A900 56%, #E8590C 80%, #C5160B 100%)`

### 3.4 Semânticas

Cores de feedback de estado. Os hex seguem convenções comuns no setor público brasileiro (alinhadas, entre outras, ao gov.br DS) por familiaridade do usuário final.

| Token | Hex | Fundo |
|---|---|---|
| `--c-success` | `#168821` | `#E3F5E4` |
| `--c-warning` | `#FFCD07` | `#FFF6D6` |
| `--c-danger` | `#E52207` | `#FBE3DF` |
| `--c-info` | `#155BCB` | `#E6EEFB` |

> O amarelo `#FFCD07` não atinge contraste suficiente para texto sobre branco. Use-o como preenchimento com texto escuro, ou empregue o tom escurecido `#9A7700` para texto/ícone de alerta.

### 3.5 Neutros

Cinza de temperatura fria-equilibrada — mais moderno que o cinza plano padrão, mantendo sobriedade.

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
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

| Papel | Família | Observação |
|---|---|---|
| Display / títulos / UI / corpo | **Rawline** | Fonte aberta, conhecida do público que utiliza serviços do gov.br; *fallback* Raleway, depois sistema |
| Dados, valores monetários, scores | **Roboto Mono** | Numerais tabulares — precisão tabular comunica confiabilidade fiscal |

Pilha de fontes:

```css
--font-ui: "Rawline","Raleway",system-ui,-apple-system,"Segoe UI",sans-serif;
--font-data: "Roboto Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
```

Escala de tipos:

| Estilo | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | 46 px | 800 | Heros, abertura de página |
| H1 | 32 px | 800 | Título de seção principal |
| H2 | 24 px | 700 | Subtítulo de seção |
| H3 | 19 px | 700 | Títulos de card / bloco |
| Corpo | 16 px | 400 | Texto padrão |
| Label | 13 px | 600 | Rótulos, cabeçalhos de tabela (maiúsculas, *tracking* 0,06em) |
| Dado | Roboto Mono, 22 px | 600 | KPIs, valores, scores |

> Na produção, a face primária é a **Rawline** (servida via CDN pública). O HTML de visualização renderiza em **Raleway** como substituta aberta mais próxima quando a Rawline não está disponível no ambiente.

---

## 5. Espaçamento, raio e elevação

**Espaçamento** — base de 4 px:
`--s-1 4` · `--s-2 8` · `--s-3 12` · `--s-4 16` · `--s-5 20` · `--s-6 24` · `--s-8 32` · `--s-10 40` · `--s-12 48` · `--s-16 64`

**Raio:**
`--r-sm 6px` (campos) · `--r-md 10px` (avisos, tabelas internas) · `--r-lg 16px` (cards, modais) · `--r-pill 999px` (botões e *tags*)

**Elevação** (três níveis, sombras suaves de tom azulado):

```css
--e-1: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.07);
--e-2: 0 6px 16px -4px rgba(16,24,40,.10), 0 2px 6px rgba(16,24,40,.06);
--e-3: 0 18px 42px -12px rgba(13,42,92,.26);
```

---

## 6. Movimento

```css
--ease: cubic-bezier(.22,.61,.36,1);   /* "fluida" */
--dur-fast: 140ms;  --dur: 220ms;  --dur-slow: 360ms;
```

Diretrizes: *hover* de cards e botões em `--dur-fast`; revelações e transições de estado em `--dur`; sequência de entrada do medidor de score em `--dur-slow`. Indicadores "ao vivo" usam pulso contínuo discreto. **Todo movimento é suprimido sob `prefers-reduced-motion: reduce`.**

---

## 7. Componentes

### Botões

Formato pílula. Variantes:

- **Primário** (`--c-brand` sólido) — ações de efeito jurídico, exigem decisão do auditor.
- **Secundário** (contorno azul) e **Ghost** (texto azul) — ações de apoio.
- **Aurora** (gradiente) — exclusivo de recursos de IA (ex.: "Perguntar ao Copilot").
- **Perigo** (`--c-danger`) — descartes e ações destrutivas.
Foco visível obrigatório: `outline: 3px solid --c-brand-300; offset 2px`.

### Campos

Borda `--n-300`, raio `--r-sm`; foco com borda `--c-brand` e halo `--c-brand-050`. Texto de apoio para alertar sobre acesso a dado identificável (autenticação/RBAC).

### Tags de risco e status

Pílulas com ponto colorido. Cinco níveis de risco (§3.3) + status operacionais (`Aguardando aprovação`, `Detectado por agente`).

### Avisos (notice)

Quatro tons semânticos com borda lateral de 4 px. Voz da interface: direta, sem desculpas, sempre indicando o que fazer (ex.: "Prazo de ciência em 3 dias").

### KPI cards

Rótulo + ícone, valor em Roboto Mono, tendência com seta colorida. *Hover* eleva o card. Indicadores do RF05: recuperado, casos abertos, potencial recuperável, acurácia.

### Tabela de casos

Cabeçalho em label maiúsculo, linhas com *hover* azul sutil, valores monetários em Roboto Mono, *score-pill* colorida pelo nível de risco e coluna de origem (`Agente` vs `Cadastro`).

---

## 8. Padrões de domínio

### Medidor de score (assinatura)

Semicírculo com o gradiente de risco contínuo, ponteiro e número em Roboto Mono. Acompanha rótulo de nível e prioridade. Entrada animada (suprimível). É o objeto visual mais memorável do sistema.

### Esteira de agentes (24/7)

Cards de agente com avatar gradiente Aurora, nome e estado em tempo real (ponto verde = ativo, cinza = ocioso). Reflete os fluxos FA01–FA11. Comunica que a inteligência opera de forma contínua e transparente.

### Copilot Fiscal

Superfície escura com camada Aurora, balões de conversa e campo de pergunta. Rótulo permanente: *consulta em linguagem natural · não executa ações* (RF10). Respostas exibem a contagem de fontes ("Fundamentado em N fontes") para sustentar explicabilidade.

### Canal do cidadão (autorregularização)

Card institucional sóbrio, linguagem clara e acolhedora, valor em destaque, indicador de passos e ações (`Simular parcelamento`, `Contestar`). Atende ao RF07: comunica a divergência, conduz à regularização e abre canal de contestação. Tom de voz: orientador, nunca punitivo.

---

## 9. Acessibilidade e conformidade

- Alvo **WCAG 2.1 AA**: contraste mínimo 4,5:1 para texto; foco visível em todos os interativos.
- Risco e status nunca dependem só de cor — sempre acompanhados de rótulo textual (≈4,5% da população tem alguma insensibilidade cromática).
- `prefers-reduced-motion` respeitado em todo movimento.
- Interface em **português do Brasil**, baixa curva de aprendizado (RNF03).
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
  /* Espectro de risco */
  --c-risk-1:#168821; --c-risk-2:#7FB23C; --c-risk-3:#F2A900; --c-risk-4:#E8590C; --c-risk-5:#C5160B;
  --grad-risk:linear-gradient(90deg,#168821 0%,#7FB23C 28%,#F2A900 56%,#E8590C 80%,#C5160B 100%);
  /* Semânticas */
  --c-success:#168821; --c-warning:#FFCD07; --c-danger:#E52207; --c-info:#155BCB;
  /* Neutros */
  --n-0:#FFFFFF; --n-25:#F7F9FC; --n-50:#F1F4F9; --n-100:#E6EAF2; --n-200:#D3DAE6;
  --n-300:#B4BECE; --n-400:#8B97AC; --n-500:#66718A; --n-600:#54607A; --n-700:#333D52;
  --n-800:#1F2737; --n-900:#121826;
  --t-strong:#121826; --t-default:#1F2737; --t-muted:#54607A; --t-on-brand:#FFFFFF;
  --surface:#FFFFFF; --app-bg:#F4F6FB; --border:#E1E6F0;
  /* Tipografia */
  --font-ui:"Rawline","Raleway",system-ui,-apple-system,"Segoe UI",sans-serif;
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

- **Versionamento semântico** do sistema (atual: v1.0). Mudanças de token são *breaking* e exigem nova *major*.
- Mudanças normativas devem ser absorvidas por **configuração de tokens**, sem refatoração de componentes (alinhado ao RNF05 — manutenção evolutiva).
- Componentes do FiscoCheck DS são mantidos neste documento; quando uma referência externa atualizar um padrão que afete o sistema (ex.: gov.br DS), a equipe avalia caso a caso a incorporação.
- **Referências analisadas durante a construção** (não-exaustivo): gov.br Design System (UI Kit e *dashboard* administrativo, inclusive a fonte Rawline), GOV.UK Design System, US Web Design System, NHS Design System, sistemas internos do time em produtos fiscais e financeiros, e boas práticas de sistemas de design para serviços públicos.
- **Construções originais** que pertencem ao FiscoCheck DS e não derivam de nenhum sistema externo: a paleta semântica de risco (§3.3), a camada Aurora para IA (§3.2), o medidor de score (§8) e a esteira de agentes (§8).
