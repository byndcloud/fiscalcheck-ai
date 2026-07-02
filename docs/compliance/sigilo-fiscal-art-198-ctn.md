# Sigilo Fiscal — art. 198 do CTN

> Lei nº 5.172/1966 (Código Tributário Nacional), artigo 198, com redação dada pela LC 104/2001.

## Texto da lei (resumo operacional)

> "Sem prejuízo do disposto na legislação criminal, é vedada a divulgação, por parte da Fazenda Pública ou de seus servidores, de informação obtida em razão do ofício sobre a situação econômica ou financeira do sujeito passivo ou de terceiros e sobre a natureza e o estado de seus negócios ou atividades."

Em outras palavras: **dado fiscal não pode vazar.** Ponto.

## Implicações para o FiscalCheck AI

### Quem pode acessar

| Papel | Pode ver dado identificável? | Pode ver agregados? |
| --- | --- | --- |
| `auditor` | Sim, dos contribuintes da sua carteira | Sim |
| `supervisor` | Sim, da equipe sob sua supervisão | Sim |
| `admin` | Apenas para configurar a plataforma; NÃO para operação fiscal | Sim |
| `cidadao` | Apenas dados sobre **si mesmo** | Não |
| `agente_sistema` | Sim (operações automatizadas), com tudo logado | Sim |

Implementação: RBAC em `apps/api/src/fiscalcheck_api/modules/compliance/rbac/`.

### Onde o dado pode estar

- **Banco de produção**: sim, em claro (necessário para o auditor operar).
- **Logs estruturados**: NÃO em claro. Sempre pseudonimizado.
- **LLM externo (OpenAI, Anthropic)**: NÃO em claro. Sempre pseudonimizado antes do envio.
- **Datasets de treinamento**: NÃO em claro. Pseudonimizado obrigatoriamente.
- **Ambiente de simulação (módulo 7)**: NUNCA dados reais.
- **Ambientes de dev / staging**: somente dados sintéticos ou pseudonimizados.
- **Backups**: criptografados em repouso (AES-256) e em trânsito (TLS 1.2+).

### Quando o dado pode sair

Vazamento de informação fiscal é crime (`art. 325 do CP` + sanções administrativas LGPD). Saídas legítimas:

- **Para o próprio titular** (portal do cidadão).
- **Por requisição judicial** (com registro em audit log).
- **Para outras autoridades fiscais** (convênios, com base legal explícita).
- **Em forma agregada** (sem reidentificação possível).

Toda saída é registrada em `audit_log` com:

- `actor_id` (quem solicitou/aprovou)
- `correlation_id`
- `recipient` (a quem foi enviado)
- `legal_basis` (referência legal)
- `payload_hash` (não o payload em si, mas hash para integridade)

### O que o sistema bloqueia automaticamente

O agente Guardrail (módulo 6) bloqueia:

- Tentativas de export massivo sem aprovação dupla.
- Consultas que retornem dados de fora da carteira do auditor.
- Acessos atípicos (horários, IPs, volumes).
- Envio a LLM externo sem pseudonimização (verificado por middleware).

### Em caso de suspeita de uso indevido

Procedimento em [`runbook-incidente-24h.md`](./runbook-incidente-24h.md).

Adicionalmente, configurar **alerta crítico** no `modules/compliance/audit/` para padrões como:

- Acesso a > N contribuintes em < M minutos pelo mesmo auditor.
- Acesso a contribuinte sem caso atribuído ao auditor.
- Acesso fora do horário de expediente (configurável).

## Treinamento da equipe

Item explícito do edital (módulo 7). Cobertura mínima:

- O que é sigilo fiscal e quais condutas o violam.
- Diferença entre dado fiscal e dado pessoal (e onde se sobrepõem).
- Como agir se receber pedido externo (judicial vs informal).
- Como reportar incidente interno.
