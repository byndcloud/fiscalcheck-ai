# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento adota [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Changed — Rota `/ai` renomeada para `/ia-preditiva` (2026-07-07)

- Página "Risco & IA" renomeada para **"IA Preditiva"** (alinhada ao nome do módulo 3 em `docs/modules/`) e movida de `/ai` para `/ia-preditiva`, seguindo a convenção pt-BR kebab-case das demais rotas (`/analise-de-redes`, `/modelo-de-risco`).
- Ícone da sidebar perdeu o acento aurora exclusivo — todos os itens de navegação seguem o mesmo padrão neutro; a camada aurora (DS §3.2) continua reservada às saídas de IA dentro das telas.
- Layout: `min-w-0` na coluna de conteúdo do `AppShell` e `overflow-x-auto` no `DataTable` — tabelas largas rolam internamente em vez de forçar scroll horizontal na página inteira; a fila de risco ficou mais compacta (situação cadastral embutida na célula do contribuinte, destaque só quando ≠ ativa).

### Added — T08 · Fila priorizada e Score de Risco / Visão 360 (RF03/FA03) (2026-07-06)

Fila do auditor ordenada pelo Agente de Score e página de detalhe do contribuinte (módulo 3) — a seleção de quem fiscalizar deixa de ser aleatória e cada score é navegável até a sua explicação (T09).

- **Schemas** ([`risk-queue.ts`](<./packages/shared-types/src/schemas/risk-queue.ts>) e [`contribuinte-360.ts`](<./packages/shared-types/src/schemas/contribuinte-360.ts>)): `RiskQueueItem` (score + cadastro + caso vinculado + tipo de inconsistência numa linha só, com `statusTratamento` distinguindo quem já está em tratamento) e `Contribuinte360` (agregado read-only com declarações PGDAS/DES, NFS-e, dívida ativa, pagamentos, evolução do score e casos).
- **Handlers MSW**: `GET /ai/queue` compõe a fila a partir das fixtures existentes (scores, contribuintes, casos, divergências) ordenada por score desc — `valorPotencial` prefere o do caso vinculado para bater com o Kanban; `GET /taxpayers/:id/360` agrega a visão completa (404 amigável para id inexistente). Históricos em [`contribuinte-360.ts`](<./apps/web/mocks/fixtures/contribuinte-360.ts>) com evolução do score coerente com o histórico de publicações do modelo (T02: v2.2 → v2.4) e declarações que narram os mesmos indícios dos fatores XAI.
- **Página nova `/fila-de-risco`** (item próprio na sidebar, papéis auditoriais): rótulo aurora "Fila ordenada pelo Agente de Score" (DS §3.2 — saída de IA, nunca ação fiscal), painel **"Segmentação da carteira"** com chips-filtro por nível de risco (contagem + valor potencial somado), porte/regime e tipo de inconsistência, e tabela com posição, contribuinte (CNPJ `data-sensitive`), **score-chip do DS §8** + pill semáforo, valor potencial recuperável, setor (CNAE), situação cadastral, status de tratamento e CTA "Visão 360". A ordem do agente nunca é re-priorizada pelo front. Estados vazio/carregando/erro via `AsyncBoundary` (T25).
- **Visão 360 `/fila-de-risco/[contribuinteId]`**: header de detalhe (razão social, CNPJ, IM, regime, situação), faixa hero com o **medidor de score do DS §8** ([`risk-gauge.tsx`](<./apps/web/components/risk/risk-gauge.tsx>) — semicírculo SVG com gradiente de risco, ponteiro e número Montserrat 48/800, `role="meter"`) + próxima ação recomendada rotulada como recomendação do agente ("o agente recomenda · a decisão é do auditor"), e 4 abas: **Visão geral** ("Por que este score?" T09 embutido + [`score-history-chart.tsx`](<./apps/web/components/risk/score-history-chart.tsx>) com `modeloVersao` por ponto no tooltip — rastreabilidade — + dados cadastrais/sócios), **Declarações & NFS-e**, **Dívida & pagamentos** e **Casos vinculados** (deep-link "Abrir dossiê" via dossiê global T13). Empty states pt-BR por seção; 404 renderiza erro com retorno à fila.
- **Testes** (6 casos novos): [`risk-queue-page.test.tsx`](<./apps/web/tests/risk-queue-page.test.tsx>) (ordenação preservada, rótulo do agente, CTA Visão 360, segmentação filtra sem re-priorizar) e [`contribuinte-360-page.test.tsx`](<./apps/web/tests/contribuinte-360-page.test.tsx>) (medidor acessível, T09 embutido, dossiê a partir dos casos vinculados, 404 amigável).

### Added — T14 · Anotações, prazos e devolutivas no caso (RF04) + T12 · Análise de Redes (RF08/FA09) (2026-07-06)

**T14 — Gestão do caso no dossiê (módulo 4)**

- **Schema** ([`case-collab.ts`](<./packages/shared-types/src/schemas/case-collab.ts>)): `CaseAnnotation` (anotação append-only com autoria), `DevolutivaTratamento` (Acatar / Manter / Solicitar complemento + justificativa + autoria) e `DevolutivaPreTriagem` (recomendação não vinculante do agente). `CitizenInteracao` (T16) ganhou `preTriagem` e `tratamento` opcionais — a devolutiva do cidadão vira item tratável no lado do auditor.
- **Prazo com contagem regressiva** ([`lib/prazo.ts`](<./apps/web/lib/prazo.ts>) + `CaseDeadlineChip`): escala muted → âmbar (≤3 dias) → vermelho (vence hoje/vencido) compartilhada entre Kanban, **Lista** (antes só data seca — aceite: vencidos destacados na fila) e o cabeçalho do dossiê.
- **Linha do tempo unificada** ([`case-timeline.tsx`](<./apps/web/components/cases/case-timeline.tsx>)): eixo vertical com autoria + timestamps fundindo criação do caso, decisões, documentos emitidos, anotações e devolutivas (destaque âmbar) + seus tratamentos.
- **Caixa de devolutivas** ([`devolutivas-panel.tsx`](<./apps/web/components/cases/devolutivas-panel.tsx>)): cada devolutiva chega com a pré-triagem do agente (sugestão destacada no botão correspondente); o auditor registra Acatar/Manter/Solicitar complemento com justificativa obrigatória — `POST /cases/:id/interacoes/:interacaoId/tratamento`, idempotente (409), refletido em `observacoes` do caso.
- **Anotações do auditor** ([`annotations-panel.tsx`](<./apps/web/components/cases/annotations-panel.tsx>)): `GET/POST /cases/:id/annotations` com RBAC (cidadão → 403), autoria via headers `X-Actor-*` e trilha imutável.
- **Sino (T01)**: notificações com `linkHref` ganharam botão "Abrir caso" — devolutiva nova aponta para `/cases?caso=…` (deep-link do dossiê) e é marcada como lida ao navegar.
- **Seed demonstrável**: contestação pendente com pré-triagem + 2 anotações num caso notificado — o fluxo completo aparece sem depender de ação prévia no portal.
- **Testes** (10 casos novos): [`case-collab-handlers.test.ts`](<./apps/web/tests/case-collab-handlers.test.ts>) (anotações com autoria/RBAC, pré-triagem, tratamento idempotente, devolutiva → sino com deep-link) e [`prazo.test.ts`](<./apps/web/tests/prazo.test.ts>) (escala de alerta).

**T12 — Análise de Redes / Graph Analytics (módulo 3)**

- **Página nova `/analise-de-redes`** (item próprio na sidebar, papéis auditoriais), layout alinhado ao protótipo de referência: barra de contexto (comunidade, período, tipos de vínculo, profundidade), 6 métricas da comunidade, canvas do grafo + painel lateral e a **biblioteca de cenários abaixo do grafo** — clicar num cenário troca o grafo exibido.
- **Schema** ([`network.ts`](<./packages/shared-types/src/schemas/network.ts>)): `NetworkScenario` (comunidade suspeita com nós, vínculos, padrões detectados e recomendação do agente), nós com score de rede, **centralidade**, **ligações com autuados** e identidades unificadas (resolução de entidades); vínculos societário/endereço/financeiro.
- **5 cenários demonstráveis** ([`network-scenarios.ts`](<./apps/web/mocks/fixtures/network-scenarios.ts>), aceite): fragmentação artificial de receita (polo têxtil, C-07 → dossiê `cs-2026-0148`), conluio de fornecedores (construção civil, C-11 → `cs-2026-0128`), interposição de pessoas (C-04), endereço compartilhado (C-09) e rede familiar com revezamento de MEI (C-15). `GET /network/scenarios` validado por schema.
- **Grafo SVG interativo** ([`network-graph.tsx`](<./apps/web/components/network/network-graph.tsx>)): sem lib nova (ADR-0005) — zoom por botões, arestas coloridas por tipo (societário sólido azul, endereço tracejado, financeiro âmbar), raio do nó proporcional ao score de risco, legenda completa e nós focáveis por teclado.
- **Drawer do nó** ([`node-drawer.tsx`](<./apps/web/components/network/node-drawer.tsx>), aceite: clicar no nó abre o detalhe): identidades unificadas, indicadores de risco de rede (score, centralidade, ligações com autuados), "Abrir dossiê" (deep-link) e "Adicionar ao caso" (mock com toast, sujeito à validação do auditor).
- **Painel lateral**: cards "Padrões detectados" com severidade no espectro de risco + card navy "Recomendação do agente" com CTA "Abrir dossiê consolidado".
- **Filtros combináveis**: comunidade e período recortam os cenários; chips de vínculo ligam/desligam arestas; profundidade 1 nível restringe ao nó articulador (maior score) e vizinhos diretos.
- **Testes** (6 casos novos): [`network-handlers.test.ts`](<./apps/web/tests/network-handlers.test.ts>) (≥5 cenários com fragmentação + conluio, integridade do grafo, sigilo dos documentos) e [`analise-de-redes-page.test.tsx`](<./apps/web/tests/analise-de-redes-page.test.tsx>) (biblioteca de cenários, troca de grafo, drawer do nó).

### Added — T06 · Non-filer Discovery (RF02) + T07 · Feed CTC (RF09/FA10) (2026-07-06)

`/crossing` reestruturado em **3 abas** — Divergências (T05), **Fora do radar** (T06) e **Monitoramento CTC** (T07) — cobrindo as três frentes do módulo 2 numa única tela.

**T06 — Fora do radar (Non-filer Discovery)**

- **Schema** ([`non-filer.ts`](<./packages/shared-types/src/schemas/non-filer.ts>)): `NonFiler` com indícios tipados por fonte (`nfse_terceiros` | `meios_pagamento` | `fonte_aberta`), cada um com resumo, referência auditável e valor estimado; receita estimada 12m; documentos sempre mascarados.
- **Fila priorizada** por receita estimada não declarada, com posição numerada, badge por fonte do indício (aceite: *qual fonte revelou*), badge AGENTE e receita em destaque.
- **CTA "Iniciar inscrição de ofício"** com diálogo de confirmação do auditor (human-in-the-loop): `POST /crossing/non-filers/:id/open-case` abre um **caso candidato real** em `casosMutable` — aparece na fila `/cases` com recomendação estruturada baseada nos indícios e vira link "Ver caso candidato" (deep-link do dossiê). Segunda tentativa → 409.
- **Fixture** ([`non-filers.ts`](<./apps/web/mocks/fixtures/non-filers.ts>)): 6 perfis sintéticos da economia local (facção têxtil, buffet, pilates, TI, transporte escolar, marcenaria com CNPJ baixado).

**T07 — Feed de Monitoramento Contínuo CTC**

- **Schema** ([`ctc.ts`](<./packages/shared-types/src/schemas/ctc.ts>)): `CtcBatch` (lote com notas, valor, regras avaliadas, tempo de processamento) e `CtcAlert` (regra que disparou, janela fato gerador → detecção em minutos, score incremental).
- **Simulação determinística** ([`ctc-feed.ts`](<./apps/web/mocks/fixtures/ctc-feed.ts>)): o handler gera 1 lote a cada 8s conforme o relógio avança (sem `Math.random`), mantendo os últimos 18; 1 a cada 3 lotes carrega alerta antecipado com uma de 5 regras de monitoramento.
- **Feed que atualiza sozinho** (`refetchInterval` 5s, aceite) com indicador "Ao vivo", contadores da janela (lotes, NFS-e, alertas antecipados e **janela média fato gerador → detecção**, aceite) e item alertado realçado em âmbar citando **a regra que disparou** (aceite).
- **CTA "Sugerir autorregularização"**: `POST /crossing/ctc/alerts/:id/suggest` abre caso candidato real com recomendação `autorregularizacao` citando a regra; alerta vira link "Ver caso". Link "Ver casos abertos nos últimos minutos" → `/cases`.
- **Infra**: `respondValidated` agora aceita `status` (201 nos POSTs de criação).
- **Testes** (9 casos novos): [`non-filer-handlers.test.ts`](<./apps/web/tests/non-filer-handlers.test.ts>) (priorização, caso real na fila, 409/404), [`ctc-feed-handlers.test.ts`](<./apps/web/tests/ctc-feed-handlers.test.ts>) (contadores, avanço do relógio gera lotes — fake `Date` —, sugestão idempotente) e [`crossing-tabs.test.tsx`](<./apps/web/tests/crossing-tabs.test.tsx>) (aceites de UI das duas abas).

### Added — T05 · Cruzamento e Inconsistências (RF02/FA02) + complemento T09 (2026-07-06)

Tela `/crossing` reconstruída como **caso instruído e auditável, não alerta estatístico** (módulo 2), fechando também os pontos de acesso restantes do aceite do T09 ("todo score exibido dá acesso ao painel de fatores", módulo 3).

**T05 — Cruzamento (módulo 2)**

- **Schema** ([`packages/shared-types/src/schemas/divergencia.ts`](<./packages/shared-types/src/schemas/divergencia.ts>)): novo tipo `inativo_atividade` ("inativo com atividade" — filtro citado no edital) e par opcional `valorDeclarado`/`valorApurado` para o lado a lado do detalhe (invariante: `valorApurado − valorDeclarado = valor`). Rótulos/explicações atualizados em todos os consumidores (crossing, treinamento, PDF do dossiê e linguagem clara do cidadão).
- **Filtros combináveis** (E entre dimensões, OU nos chips): chips por tipo, período (competência), faixa de valor (só monetárias) e setor derivado da divisão CNAE da atividade principal (`setorFromAtividade`). Lógica pura em [`lib/crossing/filter-divergencias.ts`](<./apps/web/lib/crossing/filter-divergencias.ts>) + contador "X de Y divergências" e botão limpar.
- **Lista**: razão social + CNPJ mascarado (lookup de contribuintes), badge do tipo, badge **AGENTE** (reuso do `AgentRecommendationBadge`) na origem do cruzamento, diferença (R$) em destaque (`--c-risk-4-txt`), StatusBadge de risco por severidade e estados vazio/carregando/erro via `AsyncBoundary` (T25).
- **Detalhe** ([`components/crossing/divergencia-detail-sheet.tsx`](<./apps/web/components/crossing/divergencia-detail-sheet.tsx>)): lado a lado "valor declarado × documentado em NFS-e", **cálculo explícito da diferença** (apurado − declarado = diferença), evidências primárias nominais (NFS-e com número, emissão, descrição, valor e ISS; fallback textual para evidências de cadastro/grafo), painel "Por que este score?" (T09) quando o contribuinte tem score e **link para o Dossiê (T13)** — novo deep-link `/cases?caso=…` abre o dossiê direto.
- **Fixtures**: `divergenciasFixture` agora cobre TODOS os `divergenciaIds` referenciados em `casosFixture` (antes ~40 IDs pendurados) — camada handcrafted rica + camada gerada deterministicamente do próprio caso; `nfseFixture` ganhou notas nominais (restaurante, imobiliária, TI suspensa) + geração automática de notas que **somam exatamente o `valorApurado`** de cada divergência declarado × NFS-e.
- **Testes** (13 casos novos): [`filter-divergencias.test.ts`](<./apps/web/tests/filter-divergencias.test.ts>) (golden tests das combinações), [`divergencias-fixture.test.ts`](<./apps/web/tests/divergencias-fixture.test.ts>) (invariantes: nenhum link quebrado, conta fecha, NFS-e somam o apurado) e [`crossing-page.test.tsx`](<./apps/web/tests/crossing-page.test.tsx>) (badge AGENTE, chips, detalhe com evidências + link dossiê).

**T09 — complemento (módulo 3)**

- **Dashboard**: casos priorizados por risco ganharam botão "Ver fatores" que abre o painel "Por que este score?" em Sheet lateral — o score exibido no dashboard não era acessível antes.
- **Detalhe da divergência** (`/crossing`): `ScoreFactorsPanel` embutido quando o contribuinte tem score, antecipando o reuso previsto para a visão 360 (T08).
- **Teste**: [`dashboard-score-factors.test.tsx`](<./apps/web/tests/dashboard-score-factors.test.tsx>).

### Added — T20 · Ambiente de Simulação e Capacitação (RSC04) (2026-07-05)

Modo "Treinamento" para novos auditores (módulo 6): biblioteca de casos-exercício com dados 100% anonimizados e gabarito baseado em decisão histórica — sem nenhuma mistura com o ambiente "real" (handlers, estado in-memory e rota exclusivos do treino; nenhuma tentativa gera caso, notificação ou entrada de auditoria).

- **Schemas** em [`packages/shared-types/src/schemas/training.ts`](<./packages/shared-types/src/schemas/training.ts>): `TrainingCase` (contribuinte por codinome + CNPJ mascarado, contexto, divergência com valores, score/fatores em resumo, recomendação do agente), `TrainingAttemptRequest` (ação + justificativa obrigatória ≥ 20 chars — treinar a motivação do ato faz parte do exercício) e `TrainingAttemptResult` (sua decisão × gabarito + desfecho real + aprendizado). O gabarito fica **fora** do schema público do caso de propósito.
- **Fixture** em [`mocks/fixtures/training-cases.ts`](<./apps/web/mocks/fixtures/training-cases.ts>): 6 exercícios (2 iniciante / 2 intermediário / 2 avançado) cobrindo os 5 tipos de divergência + 2 casos de **falso positivo didático** (score alto por fator de rede minoritário e anomalia estatística com explicação econômica) — ensinam que score alto ≠ caso procedente (human-in-the-loop).
- **Handlers MSW**: `GET /training/cases` **nunca vaza o gabarito** antes da tentativa (testado por serialização); `POST /training/cases/:id/attempt` valida a justificativa, avalia o acerto contra a decisão histórica, persiste in-memory (progresso sobrevive à navegação) e bloqueia segunda tentativa (409 — o gabarito já foi revelado).
- **Sidebar**: nova seção "Capacitação" com o item **Treinamento** (papéis auditoriais), ícone com acento âmbar (`--c-warning`) para diferenciar visualmente do ambiente real.
- **Página [`/treinamento`](<./apps/web/app/(dashboard)/treinamento/page.tsx>)**: faixa âmbar permanente "AMBIENTE DE TREINAMENTO · dados anonimizados" (`TrainingBanner`, reutilizada em versão compacta dentro do exercício), card de progresso (concluídos + decisões alinhadas ao gabarito) e biblioteca em grid com estados via `AsyncBoundary`.
- **`TrainingCaseSheet`**: fluxo didático em 2 tempos — ler o caso anonimizado, escolher `aprovar|ajustar|rejeitar` e justificar; só então o painel **"Sua decisão × decisão histórica"** compara as justificativas lado a lado, mostra "o que aconteceu no caso real" e o aprendizado a levar. Toast informativo diferencia acerto de divergência ("errar aqui é o objetivo do treino").
- **Tokens**: variáveis `--c-risk-*-txt` do DS §10 (texto com contraste AA sobre fundos de risco) declaradas em `globals.css` — já eram referenciadas por `risk-model-form`/`modelo-de-risco` sem declaração.
- **Testes** (8 casos novos): [`training-handlers.test.ts`](<./apps/web/tests/training-handlers.test.ts>) (anonimização da biblioteca, gabarito não vaza no GET, validação de justificativa, persistência da tentativa, 409 na segunda tentativa, 404) e [`training-page.test.tsx`](<./apps/web/tests/training-page.test.tsx>) (faixa âmbar, biblioteca anonimizada, fluxo completo decidir → gabarito, bloqueio sem justificativa mínima).

### Added — T27 · Perfil e preferências do usuário (transversal) (2026-07-05)

Menu do avatar no header para **todos os papéis**, com preferências persistidas na camada de serviço fake (módulo: Transversal).

- **Schemas** em [`packages/shared-types/src/schemas/user-profile.ts`](<./packages/shared-types/src/schemas/user-profile.ts>): `UserProfile` (nome, papel, e-mail, matrícula), `UserPreferences` (tamanho da letra `padrao|grande`, densidade `confortavel|compacta`, notificações on/off) e `CitizenRegistration` — dados cadastrais detalhados exibidos **apenas ao papel `cidadao`** (CPF mascarado, telefone, endereço e empresas vinculadas com CNPJ mascarado/IM/vínculo). CPF/CNPJ sempre mascarados no contrato.
- **Perfis fake com nomes distintos por papel** em [`mocks/fixtures/user-profiles.ts`](<./apps/web/mocks/fixtures/user-profiles.ts>): Marina Coelho Steinbach (auditora), Ricardo Tavares Krieger (gestor), Patrícia Nunes Moser (admin) e Ana Paula Hoffmann (contribuinte — a "Ana P." sócia-administradora de ct-002, com vínculos que explicam a carteira ct-002/ct-003/ct-004 do portal). `session-store` e `POST /auth/login` passam a usar essas identidades como default.
- **Handlers MSW**: `GET /me?role=…` (perfil + preferências) e `PUT /me/preferences` (merge parcial, persistido in-memory por papel — preferências não vazam entre perfis na demo).
- **`UserMenu`** em [`components/app-shell/user-menu.tsx`](<./apps/web/components/app-shell/user-menu.tsx>): avatar com iniciais no header abre popover com identidade, seção "Dados cadastrais" (cidadão, campos `data-sensitive`), preferências (segmentados de letra/densidade + switch de notificações, salvamento imediato com toast) e ação **Sair**. Header deixou de ter bloco de identidade + logout soltos.
- **Efeito real das preferências**: `data-font-scale`/`data-density` aplicados no `<html>` — letra "grande" escala o rem raiz e densidade "compacta" reduz o `--spacing` do Tailwind v4 (tokens em `globals.css`). "Notificações no sino" desligada silencia badge/ícone do `NotificationBell` sem esconder o histórico.
- **Testes** (9 casos novos): [`user-profile-handlers.test.ts`](<./apps/web/tests/user-profile-handlers.test.ts>) (identidades distintas, dados cadastrais só do cidadão, merge parcial, isolamento por papel, validações) e [`user-menu.test.tsx`](<./apps/web/tests/user-menu.test.tsx>) (identidade no popover, dados cadastrais, PUT de preferência, Sair).
- **Item "Meus dados" na sidebar do cidadão + página de edição**: item de navegação "Meus dados" na sidebar do papel `cidadao` (mesma identidade visual dos demais itens, com estado ativo pelo href mais específico) → nova página [`/citizen/dados`](<./apps/web/app/(dashboard)/citizen/dados/page.tsx>) — formulário pré-preenchido (react-hook-form + zod, mensagens em linguagem clara) que salva contato/endereço via `PUT /me/registration` (persistência in-memory + `atualizadoEm`). CPF, e-mail (gov.br) e vínculos societários exibidos como somente leitura, com explicação da via formal (Junta Comercial/atendimento). No popover do avatar, a seção detalhada virou o atalho "Meus dados cadastrais — ver e editar". Testes: `citizen-dados-page.test.tsx` + casos novos em `user-profile-handlers.test.ts` e `sidebar.test.tsx`.

### Added — T16 · Portal do Contribuinte / Autorregularização + T09 · Explicabilidade das classificações (2026-07-05)

Entrega conjunta dos módulos 4 (RF07/FA05) e 3 (RF03), reutilizando a identidade visual vigente (DS v2.0, T25 para estados/toasts).

**T09 — Explicabilidade (módulo 3)**

- **`ScoreFactorsPanel`** em [`apps/web/components/risk/score-factors-panel.tsx`](<./apps/web/components/risk/score-factors-panel.tsx>): painel "Por que este score?" com barras de contribuição por fator (±pts) ordenadas por magnitude, chip de origem (cruzamento/rede societária/cadastro/histórico), evidência de cada fator e rodapé fixo "Explicabilidade registrada para defesa perante órgãos de controle" + `modeloVersao`/`calculadoEm` (reprodutibilidade). Barras usam o espectro de risco do DS (§2.2): fator que aumenta o risco em `risk-4`, mitigador em `risk-1`.
- **Integração no Dossiê (T13)**: nova seção do painel entre os dados do contribuinte e a recomendação em [`case-dossie-sheet.tsx`](<./apps/web/components/cases/case-dossie-sheet.tsx>), com fallback amigável quando o contribuinte não tem score na fixture.
- **Integração em `/ai`**: coluna "Explicabilidade" com botão "Ver fatores" abre o painel em Sheet lateral — todo score exibido dá acesso aos fatores (critério de aceite).
- **Fixtures ampliadas**: [`mocks/fixtures/scores.ts`](<./apps/web/mocks/fixtures/scores.ts>) ganhou 9 scores novos (ct-006/007/009/010/013/015/019/021/031) com `valor` idêntico ao `scoreValor` do caso correspondente e fatores coerentes com a narrativa da recomendação.

**T16 — Portal do Contribuinte (módulo 4)**

- **Schemas** em [`packages/shared-types/src/schemas/citizen-portal.ts`](<./packages/shared-types/src/schemas/citizen-portal.ts>): `CitizenInteracao` (linha do tempo com protocolo), `GuiaDam` (DAM mock com linha digitável sintética), requests de parcelamento/contestação/agendamento e `CitizenActionResponse`.
- **Handlers MSW** com estado em memória: `GET /citizen/cases` agora filtra por sigilo (só expõe casos formalizados — `notificado`/`em_autorregularizacao`/`fiscalizacao`/`encerrado`; triagem interna nunca aparece ao cidadão, art. 198 CTN), `GET .../divergencias` (recorte do próprio caso), `GET .../interacoes` e `POST .../{ciencia,guia,parcelamento,contestacao,agendamento}`. **Toda ação gera protocolo (`PRT-2026-…`) e devolutiva ao auditor**: notificação `tipo: "devolutiva"` no sino + atualização de `observacoes`/status do caso (adesão move para `em_autorregularizacao`) — aceite T16 × T14.
- **Simulador de parcelamento** puro e testável em [`lib/citizen/parcelamento.ts`](<./apps/web/lib/citizen/parcelamento.ts>): 1–12 parcelas, piso de R$ 100/parcela, resíduo de arredondamento na última parcela, vencimentos mensais.
- **Linguagem clara** em [`lib/citizen/plain-language.ts`](<./apps/web/lib/citizen/plain-language.ts>): tradução dos 5 tipos de divergência para explicação acolhedora sem jargão fiscal (PGDAS/NFS-e/DIMP), com "o que fazer" orientativo.
- **Portal `/citizen` reconstruído** (mobile-first, cards por pendência com rótulos do cidadão — "Aguardando sua ciência", "Regularização em andamento"…): detalhe em Sheet com **stepper acolhedor de 3 passos** (Ciência → Regularização → Confirmação), registro de ciência com protocolo, emissão de guia integral, simulador/adesão de parcelamento (gera guia da 1ª parcela), contestação completa (formulário + upload mock + protocolo) e agendamento. Acompanhamento em tempo real via linha do tempo de interações + aviso dos canais (e-mail/SMS/WhatsApp).
- **Páginas institucionais**: [`/citizen/termos`](<./apps/web/app/(dashboard)/citizen/termos/page.tsx>) e [`/citizen/privacidade`](<./apps/web/app/(dashboard)/citizen/privacidade/page.tsx>) (LGPD + contato do DPO), linkadas no rodapé do portal. Guard do layout atualizado para permitir as subrotas de `/citizen` ao papel `cidadao`.
- **Login gov.br (mock)**: botão "Entrar com gov.br" na tela de login autentica direto no papel Contribuinte e leva ao portal — cobre o acesso do contribuinte/contador sem tocar no fluxo institucional.
- **Fixture**: `dv-006` adicionada a [`mocks/fixtures/divergencias.ts`](<./apps/web/mocks/fixtures/divergencias.ts>) (era referenciada por `cs-2026-0117` e não existia).
- **Testes** (26 casos novos): [`parcelamento.test.ts`](<./apps/web/tests/parcelamento.test.ts>) (golden tests do simulador), [`plain-language.test.ts`](<./apps/web/tests/plain-language.test.ts>) (inclui bloqueio de jargão), [`score-factors-panel.test.tsx`](<./apps/web/tests/score-factors-panel.test.tsx>) (ordenação, sinais, a11y, defensabilidade) e [`citizen-portal-handlers.test.ts`](<./apps/web/tests/citizen-portal-handlers.test.ts>) (msw/node: sigilo do recorte, protocolo, devolutiva no sino, 404 fora da carteira).

### Added — T25 · Estados de vazio, carregamento e erro + Toasts (transversal) (2026-07-04)

Fundação transversal de feedback de UI. Consolida em um único conjunto o que estava espalhado por página (loading, vazio, erro, toast), sem introduzir novo design system nem substituir lib de UI existente. Base para o checklist de QA (T22).

- **Componentes reutilizáveis** em [`apps/web/components/ui/`](./apps/web/components/ui/): `Skeleton` + `SkeletonText`/`SkeletonCard`/`SkeletonRow`/`SkeletonTable`, `ErrorState` (título/descrição pt-BR + botão "Tentar novamente" + últimos 12 chars do `correlationId`) e `AsyncBoundary` — resolve precedência **loading > erro > vazio > sucesso** e evita `if/else` inline em cada tela. `EmptyState` existente foi mantido e agora é usado pelo `AsyncBoundary` como slot padrão de vazio.
- **Tratamento único de erro** em [`apps/web/lib/errors.ts`](./apps/web/lib/errors.ts): `resolveErrorMessage(unknown)` mapeia `ApiError.code` (18+ códigos catalogados dos handlers MSW) → `{ title, description }` em pt-BR sem vazar stack, path ou detalhe técnico. Fallbacks por status (401/403 → autorização, 404 → não encontrado, 5xx → indisponibilidade) e detecção de `TypeError: Failed to fetch` → mensagem de conexão. Preserva `correlationId` para telemetria.
- **Toast tipado** em [`apps/web/lib/toast.ts`](./apps/web/lib/toast.ts): `notify.success/warning/error/info(msg, opts?)` + `notify.apiError(error, opts?)` como wrapper fino sobre o `sonner` já integrado (o `Toaster` do DS em `components/ui/sonner.tsx` cobre fila, auto-dismiss, `role=status`/`role=alert` e 4 tipos por tokens semânticos). Consumidores legados que usam `toast` do sonner direto continuam funcionando; a partir de T25 o caminho recomendado é `notify.apiError` em `onError` e `notify.success` em `onSuccess`.
- **QueryClient global** em [`apps/web/components/providers.tsx`](./apps/web/components/providers.tsx): `QueryCache.onError` e `MutationCache.onError` disparam `notify.apiError` automaticamente. Escrita bem-sucedida pode declarar `meta.toastSuccess = "..."` para virar `notify.success`. Leitura pode declarar `meta.silent = true` quando a tela já mostra `ErrorState` inline (evita toast duplicado). Wiring é opt-out — silêncio explícito, ruído por padrão.
- **Telas migradas como referência**: [`/ingestion`](./apps/web/app/(dashboard)/ingestion/page.tsx) (T04), [`/cases`](./apps/web/app/(dashboard)/cases/page.tsx) (T13) e [`/comunicacoes`](./apps/web/app/(dashboard)/comunicacoes/page.tsx) (T15) trocaram `Loader2 + p.text-destructive + EmptyState` inline por `<AsyncBoundary>` + `<SkeletonTable>`/`<SkeletonCard>` + `<EmptyState>` padrão. `NotificationBell` (também T15) ganhou `SkeletonText` + botão "Tentar novamente" no popover quando `/notifications` falha.
- **Testes**: [`errors-resolve.test.ts`](./apps/web/tests/errors-resolve.test.ts) (8 casos, incluindo códigos mapeados, fallbacks por status, `TypeError: Failed to fetch` e não-vazamento de mensagem técnica), [`async-boundary.test.tsx`](./apps/web/tests/async-boundary.test.tsx) (7 casos, precedência de estados + `onRetry`) e [`query-client-toast.test.ts`](./apps/web/tests/query-client-toast.test.ts) (4 casos, `queryCache.onError`, `mutationCache.onError/onSuccess`, `meta.silent` e `meta.toastSuccess`).
- **Docs**: [`docs/design-system/design-system.md` §7 · Estados transversais](./docs/design-system/design-system.md) documenta os 5 blocos (EmptyState, Skeleton, ErrorState, AsyncBoundary, Toast) com regras de uso.

Nota de decisão: a task descrevia "Radix Toast" como base. Optamos por manter `sonner` — ele já está integrado ao root, estilizado por tokens DS e cobre o contrato pedido (fila, auto-dismiss, 4 tipos, acessibilidade). Trocar por Radix Toast introduziria duplicação sem ganho funcional.

### Added — T17 · Painel do Gestor, Metas do Piloto e Alertas (2026-07-04)

Entrega do Painel do Gestor completo do módulo 5 (RF05/FA06 do edital), estendendo a rota `/analytics` (restrita a `supervisor` + `admin`).

- **Schemas em `@fiscalcheck/shared-types`** para `PanelManagerKpis` (7 indicadores com sparkline + drill-down), `MetaPiloto` (baseline/atual/alvo + status derivado), `SusAvaliacao` e `RelatorioGerencial{Request,Response}`. `NotificacaoSchema` estendido com `origem: "manual" | "auto_kpi" | "auto_meta"` + `linkHref` para categorizar alertas do agente de relatórios.
- **[ADR-0005](./docs/adr/0005-recharts.md)** — `recharts` como biblioteca oficial de gráficos.
- **[ADR-0006](./docs/adr/0006-xlsx-sheetjs.md)** — exportação XLSX com SheetJS Community via dynamic import (chunk isolado em `/analytics`).
- **Componentes reutilizáveis** em [`apps/web/components/analytics/`](./apps/web/components/analytics/): `KpiTrendCard`, `Sparkline`, `MetaProgressCard`, `PeriodFilter`, `SusSurveyModal`, `ReportGeneratorModal`.
- **Utilitários puros** em [`apps/web/lib/analytics/`](./apps/web/lib/analytics/): `sus.ts` (fórmula Brooke 1996 + labels pt-BR) e `meta-status.ts` (transição `no_alvo → em_risco → critico`).
- **Geração de relatórios** em [`apps/web/lib/reports/`](./apps/web/lib/reports/): PDF (`GerencialPdfReport` sobre `@react-pdf/renderer`) e XLSX (`generateXlsxBlob` com dynamic import de SheetJS), ambos com `correlationId` na trilha via `POST /analytics/reports/generate`.
- **Handlers MSW novos** em [`apps/web/mocks/handlers.ts`](./apps/web/mocks/handlers.ts): `GET /analytics/panel-manager-kpis`, `GET /analytics/metas`, `POST /analytics/metas/:id/sus`, `GET /analytics/sus`, `POST /analytics/reports/generate` (RBAC supervisor/admin). Regra determinística: sempre que uma meta transita para `em_risco`/`critico`, o handler empurra `Notificacao` com `origem: "auto_meta"` para o sino.
- **Sidebar**: item `/analytics` renomeado de "Gerencial" para "Painel do Gestor".
- **Testes**: `sus-score`, `meta-em-risco`, `panel-manager-kpis` e `report-generator` (UI + payload).
- **Docs**: [`docs/modules/05-monitoramento.md`](./docs/modules/05-monitoramento.md) atualizado com a seção "Entrega T17" e [`docs/adr/README.md`](./docs/adr/README.md) com as novas entradas.

### Changed — Reconciliação pós-simplificação e sprints T01–T19 (2026-07-03)

Fecha vestígios que a simplificação do MVP (2026-07-02) e as sprints T01–T19 deixaram na documentação. Nenhum código de runtime alterado (apenas 1 docstring).

- **Deps web reintroduzidas em T01**: `react-hook-form`, `zod` (v4) e `@hookform/resolvers` **voltaram** ao [`apps/web/package.json`](./apps/web/package.json) junto com a tela de login (T01) e são usadas em [`components/auth/login-form.tsx`](./apps/web/components/auth/login-form.tsx), [`components/ui/form.tsx`](./apps/web/components/ui/form.tsx) e telas subsequentes (T02, T19). A bullet "Dependências web podadas" da simplificação abaixo cobria o estado exato do commit `d7146a0`; a partir de T01 (commit `74428c3`) essas três deps voltaram. Apenas `@radix-ui/react-slot` continua fora (substituído por `radix-ui`).
- **Links quebrados de compliance**: [`docs/README.md`](./docs/README.md) e [`CONTRIBUTING.md`](./CONTRIBUTING.md) apontavam para `docs/compliance/lgpd.md` e `sigilo-fiscal-art-198-ctn.md` (consolidados em `docs/compliance/README.md`). Corrigido.
- **Menções a skills removidas**: [`README.md`](./README.md) mencionava "coding agents (frontend, backend, QA, security)" e o docstring de [`modules/compliance/__init__.py`](./apps/api/src/fiscalcheck_api/modules/compliance/__init__.py) apontava para a skill `security-auditor` que não existe mais. Corrigido para listar apenas skills ativas (`frontend`, `backend`) e apontar para revisão humana + `docs/compliance/README.md`.
- **Skill `backend`**: linha `Auth` de [`references/00-fiscalcheck-context.md`](./.claude/skills/backend/references/00-fiscalcheck-context.md) atualizada para refletir a substituição `passlib`/`python-jose`/`pyotp` → `bcrypt` (direto) + PyJWT (com nota de MFA voltando no módulo 6).
- **Skill `frontend`**: [`references/00-fiscalcheck-context.md`](./.claude/skills/frontend/references/00-fiscalcheck-context.md) removeu ponteiros para references genéricas já excluídas (`01-component-patterns.md`, `06-design-tokens.md`) e corrigiu a linha "Tipos do backend" — no MVP são manuais (contradizia [`AGENTS.md` §4.1](./AGENTS.md)).
- **[`replit.md`](./replit.md)** alinhado ao [ADR-0003](./docs/adr/0003-preview-replit.md): workflow default é `Project` (Next.js + MSW em `PORT=5000`), não `Dev (web + api)`; tabela de portas atualizada para `5000/8080/23345/8000` (o antigo `3000 → 80` foi removido para evitar colisão com `8080 → 80`); §Troubleshooting ganhou linhas sobre `LD_LIBRARY_PATH` e o firewall do Replit (com pointer para `.agents/memory/`). **`.replit`, `.pnpmfile.cjs`, `apps/web/next.config.ts` e scripts `dev`/`start` não foram tocados.**
- **[`apps/web/README.md`](./apps/web/README.md)** §Estrutura completada com as telas de T04 (`ingestion` timeline), T10 (`esteira-de-agentes` + `hooks/use-agents-feed.ts`), T13 (`cases` + `lib/case-transitions.ts`), T15 (`comunicacoes`), T02 (`modelo-de-risco` + `lib/risk-model/simulate.ts`) e T19 (`compliance/{trilha,usuarios}` + `components/compliance/` + `lib/masks.ts` + `lib/compliance/export-audit.ts`).
- **Claims de stack não instalada** qualificados: [`AGENTS.md` §2](./AGENTS.md) e [`docs/architecture/overview.md` §Stack](./docs/architecture/overview.md) marcam LangGraph/Polars/scikit-learn/NetworkX/Redis como "não instalado — entra com o módulo que usa". [`modules/crossing/__init__.py`](./apps/api/src/fiscalcheck_api/modules/crossing/__init__.py) alinhado ao ADR-0002 (NetworkX in-memory, AGE adiado).
- **[`ADR-0001`](./docs/adr/0001-stack-inicial.md)** ganha nota curta datada `2026-07-02` esclarecendo que a mitigação "Renovate/Dependabot semanal" foi desativada (pointer para este CHANGELOG e [`SECURITY.md`](./SECURITY.md)).

### Changed — Simplificação para o MVP no Replit (2026-07-02)

Enxugamento do repositório para o escopo real da fase de validação (MVP via Replit). Tudo o que foi removido permanece no histórico do git e volta quando o produto sair do piloto.

- **Automação GitHub removida**: workflow CodeQL, `dependabot.yml` (version updates desligados; security updates continuam via configuração do repositório), `scripts/dependabot/` e `CODEOWNERS` (placeholders). Issue #26 e PR #34 fechados.
- **Hooks de commit removidos**: Husky, commitlint, lint-staged e markdownlint saíram (arquivos + devDependencies + script `prepare`). Commits locais ficam instantâneos; a validação acontece no CI. Conventional Commits vira convenção recomendada (ver `CONTRIBUTING.md`).
- **CI consolidado**: de 8 jobs para 2 (`web`: lint+typecheck+test+build; `api`: ruff+pyright+pytest), mantendo o paths-filter. Job `docs-lint` removido.
- **Dependências Python podadas** (`apps/api/pyproject.toml`): removidos scikit-learn, numpy, networkx, polars, pyarrow, langgraph, langchain-core, redis, pgvector, pyotp, tenacity, email-validator, python-multipart e python-json-logger (não usados pelo código atual — voltam com os módulos que os usam). `passlib`+`python-jose` (sem manutenção) substituídos por `bcrypt`+`PyJWT` em `core/security.py`. `uv.lock` regravado (60 pacotes a menos).
- **Dependências web podadas**: `react-hook-form`, `@hookform/resolvers`, `zod` e `@radix-ui/react-slot` removidos (não importados; voltam com as telas de formulário).
- **Docs de compliance consolidadas**: os 6 documentos de `docs/compliance/` viraram um `README.md` único com o resumo LGPD/sigilo/retenção/incidente para o MVP.
- **Skills enxugadas**: `qa-test-strategist/` e `security-auditor/` removidas; skill `frontend` reduzida a `SKILL.md` + contexto FiscalCheck (references genéricas, assets e scripts removidos); skill `backend` mantida integralmente.
- **`config.py`**: campo `redis_url` removido (Redis está fora do MVP).

### Fixed — Inconsistências identificadas no diagnóstico (2026-07-02)

- **`infra/docker-compose.yml`**: o perfil `default` não subia com `docker compose up` (perfil "default" não é especial no Compose) — postgres agora é serviço sem perfil; imagem trocada de `postgres:16-alpine` (sem pgvector — o init falharia) para `pgvector/pgvector:pg16`; `redis` e `mailhog` removidos; `postgres-age` (perfil `graph`) movido para a porta 5433.
- **Redis "gerenciado pelo Replit" não existe**: `replit.md`, `replit.nix` e `.replit` corrigidos — o Replit só oferece Postgres gerenciado; Redis fica documentado como decisão futura (provedor externo ou nuvem nacional, via ADR).
- **`.replit [deployment]`** rodava `pnpm dev` (dev servers com `--reload`/`--turbo`) no Cloud Run — agora faz build de produção (`pnpm build` + `uv sync`) e roda `next start` + `uvicorn` sem reload.
- **`replit.nix`** duplicava Node/Python já provisionados pelos `modules` do `.replit` — reduzido a pnpm, uv e utilitários.
- **`.env.example` (raiz)** usava `postgresql://` sem driver, divergindo de `apps/api` — alinhado para `postgresql+asyncpg://`; `REDIS_URL` e blocos de provedores não usados removidos.
- **`AGENTS.md`/`apps/api/README.md`** descreviam estrutura por módulo (`router.py`, `service.py`...) que não existe — marcada explicitamente como estrutura alvo.
- **`packages/shared-types`** dizia "gerado do OpenAPI, não editar à mão" mas só continha tipos manuais com a geração comentada — documentação corrigida: tipos manuais são aceitos até a geração ser ativada. Adicionada dependência `@fiscalcheck/tsconfig` que faltava (typecheck falhava).
- **`CONTRIBUTING.md`/`README.md`** documentavam fluxo `main` ← `develop`, mas `main` não existe no remoto — documentação alinhada à realidade (`develop` é default; `main` nasce na primeira release).
- **`apps/web`** reformatado com `biome check --write` (15 arquivos com indentação/EOL fora do padrão do lint).

### Added

- **Design System v2.0** documentado em `docs/design-system/design-system.md` (camada Aurora para IA, espectro de risco, foco visível 3px, motion respeitando `prefers-reduced-motion`).
- **shadcn/ui** integrado em `apps/web/components/ui/` (`button`, `card`, `input`) com variante `aurora` customizada para saídas de IA.
- **Pilha tipográfica v2.0** servida via Google Fonts — **Raleway** (UI, 400–800), **Montserrat** (display numérico de KPIs, scores e valores hero, 600–800) e **Roboto Mono** (identificadores, CNPJ, protocolos, competências, contadores, valores em linhas de tabela, 400–700). A **Rawline** auto-hospedada em `apps/web/app/fonts/` (OFL 1.1) permanece como equivalente institucional aceito para contextos gov.br, entrando apenas como fallback declarativo em `--font-ui`.
- **`pnpm-lock.yaml`** committado para reprodutibilidade do build no Replit e em CI.
- **ADR-0002** (`docs/adr/0002-database-mvp-replit.md`): MVP usa Postgres Replit + `pgvector`; Apache AGE adiado para a migração à nuvem nacional. Módulo 2 implementa `GraphStore` com `NetworkXGraphStore` no MVP e `AgeGraphStore` na fase 2.
- **Skills FiscalCheck-aware**: `references/00-fiscalcheck-context.md` em `frontend/`, `qa-test-strategist/`, `security-auditor/` carregando o recorte do domínio fiscal (LGPD, sigilo, design system, golden tests, áreas críticas).
- **Skill `backend/`** nova, em pt-BR, com `SKILL.md` + 5 references (contexto, estrutura de módulos, ETL Polars, agentes LangGraph, migrations Alembic, logging/pseudonimização).
- `infra/postgres-init-age.sql` (opt-in) e perfil `graph` no `docker-compose` para dev local que precise testar AGE em preparação à fase 2.
- Workflow `DB migrate` no `.replit` (`alembic upgrade head`).
- (Sprint anterior) Scaffold inicial do monorepo (pnpm workspaces) com `apps/web` (Next.js 15) e `apps/api` (FastAPI), estrutura dos 7 módulos, CI com paths-filter, hooks Husky + commitlint, templates LGPD (RIPD, ROPA, política de retenção, runbook 24h), `docker-compose` de dev, configuração Replit (`.replit`/`replit.nix`) e documentação principal (`README`, `AGENTS.md`, `CLAUDE.md`, `replit.md`, `CONTRIBUTING.md`, `SECURITY.md`).

### Changed

- **Design System v1.0 → v2.0** (`docs/design-system/design-system.md`). Face primária de UI passou de **Rawline** para **Raleway** (Rawline permanece como equivalente institucional aceito, não canônica). Adicionada **Montserrat** como face de display numérico (KPIs 25/700, medidor 48/800, valor hero 35/800, valor secundário 19–22/700). **Roboto Mono** restrita a identificadores e dados tabulares miúdos (IDs, CNPJ, protocolos, competências, contadores, valores em linhas de tabela). Escala recalibrada para densidade de painel. Componentes revisados: KPI card (label caps + tile de ícone tingido + valor Montserrat + pílula de tendência mono), tabela de casos (score-chip + microtag `AGENTE`), navegação lateral 252px, barra superior com botão Copilot em gradiente Aurora animado, filtros em chip, botões-cartão, Copilot Fiscal em card claro. Novos padrões de domínio documentados: Próxima melhor ação, Análise de Redes, barra de fluxo agêntico, recorte mobile do canal do cidadão. Medidor de score passa a exibir número central em Montserrat 48/800 na cor do nível. Paleta (§3), espaçamento, raios, elevação (§5) e curvas/durações de movimento (§6) inalterados. **Nota**: componentes novos ainda não implementados no frontend — apenas configuração de fontes (`apps/web/app/layout.tsx`, `apps/web/app/globals.css`) e tokens foram alinhados nesta rodada; os componentes de domínio ficam para sprints dedicados.
- **`Settings` agora falha rápido em staging/produção** se `JWT_SECRET` ou `PSEUDONYMIZATION_SALT` ainda forem os placeholders (`change-me-*`). Em `development`/`test` continuam tolerados para scaffolding.
- **`CLAUDE.md` §1** reconciliado para refletir as 4 skills reais (`frontend`, `backend`, `qa-test-strategist`, `security-auditor`) com seus nomes corretos.
- **`AGENTS.md` §4.2**: `from __future__ import annotations` passa de proibido a *permitido quando útil* (forward refs, `TYPE_CHECKING`, imports circulares) — alinhando a regra ao código já existente.
- **`.replit`**: `[[ports]]` 5432 e 6379 removidos (Postgres e Redis no Replit são serviços gerenciados, não locais). Bloco `[deployment]` agora sobe web + api em paralelo, com nota de que Replit Deployments serve apenas como ambiente de piloto/demo.
- **`replit.nix`**: postgres/redis CLIs ficam como fallback local, com comentário explicando que os serviços efetivos são os gerenciados pelo Replit.
- **`apps/web`** reformatado pelo Biome para padronizar indentação em espaços (2) e organizar imports em todos os arquivos.
- **`apps/api`** com lint Ruff e Pyright limpos: imports `TYPE_CHECKING`, constante `MAX_CORRELATION_ID_LENGTH`, tipagem do processor de structlog.
- README, `docs/architecture/overview.md`, `replit.md`, `.env.example`, `apps/api/.env.example` e `infra/postgres-init.sql` atualizados para refletir AGE como opt-in.

### Security

- `SECURITY.md` com política de divulgação responsável e SLA de resposta.
- `.gitignore` reforçado para impedir commit de `.env`, dumps de banco e dados de contribuintes.
- Validator de `Settings` impede que segredos placeholder vazem para boot em staging/produção.

### Pending

- Definição de licença do projeto (a abordar em sprint posterior).
- Implementação dos 7 módulos (sprints dedicados por módulo).
- Migrations Alembic do modelo de dados de auditoria (dependem do módulo 6 — Compliance).
