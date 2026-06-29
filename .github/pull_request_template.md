<!--
Título do PR: siga Conventional Commits, ex.:
  feat(crossing): adicionar deteccao de subdeclarante via grafo
-->

## Contexto

<!-- Que problema este PR resolve? Por que agora? -->

## Mudanças

<!-- O que foi feito? Em alto nível, não linha por linha. -->

## Módulo(s) afetado(s)

<!-- Marque o(s) módulo(s) do edital. -->

- [ ] 1. Integração, Ingestão e Qualidade de Dados (`modules/ingestion/`)
- [ ] 2. Cruzamento e Detecção de Inconsistências (`modules/crossing/`)
- [ ] 3. IA e Análise Preditiva (`modules/ai/`)
- [ ] 4. Gestão da Fiscalização e Autorregularização (`modules/cases/`)
- [ ] 5. Monitoramento Estratégico e Relatórios (`modules/analytics/`)
- [ ] 6. Segurança, Governança e Conformidade (`modules/compliance/`)
- [ ] 7. Suporte, Capacitação e Funcionalidades Adicionais (`modules/support/`)
- [ ] Transversal (infra, docs, deps, CI, scaffold)

## Impactos LGPD / sigilo fiscal

<!--
Se sim, descrever:
- Quais dados identificáveis são tocados (CPF, CNPJ, valor, etc.)?
- Há pseudonimização antes de logging/treinamento/LLM?
- Há mudança em RBAC ou audit log?
- Mudança requer revisão da skill `security-auditor`?
-->

- [ ] Sem impacto em LGPD / sigilo fiscal
- [ ] Impacto presente — descrito acima

## Como testar

<!--
Passo a passo para validar manualmente. Se houver migration, indicar.
-->

```powershell
# exemplo:
pnpm install
pnpm --filter @fiscocheck/api migrate
pnpm test
```

## Checklist do autor

- [ ] `pnpm lint` passa local
- [ ] `pnpm typecheck` passa local
- [ ] `pnpm test` passa local
- [ ] (se mudou web) `pnpm --filter @fiscocheck/web build` passa
- [ ] Adicionei/atualizei testes para mudanças de comportamento
- [ ] Atualizei documentação relevante (`docs/`, `README.md`, `CHANGELOG.md`)
- [ ] Mensagens de commit seguem Conventional Commits
- [ ] Sem `any` em TS / sem `# type: ignore` sem comentário em Python
- [ ] Sem dados reais de contribuintes em testes, fixtures ou logs

## Observações para o reviewer

<!-- Qualquer ponto específico de atenção, decisão temporária, dúvida. -->
