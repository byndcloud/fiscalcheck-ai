# Modelo de Dados — visão preliminar

> Este documento descreve o **modelo conceitual** dos dados do FiscalCheck AI. O modelo físico será materializado em migrations Alembic conforme cada módulo entrar em desenvolvimento.

## Entidades principais

```mermaid
erDiagram
    auditor ||--o{ case_decision : "decide"
    contribuinte ||--o{ documento_fiscal : "emite"
    contribuinte ||--o{ declaracao : "declara"
    contribuinte ||--o{ caso : "alvo de"
    contribuinte ||--o{ socio : "tem"
    socio }o--|| contribuinte : "eh tambem"
    documento_fiscal }o--|| caso : "evidencia"
    declaracao }o--|| caso : "evidencia"
    caso ||--o{ score_risco : "tem historico"
    caso ||--o{ notificacao : "gera"
    caso ||--o{ case_decision : "registra"
    case_decision }o--|| audit_log : "audita"

    auditor {
        uuid id PK
        string nome
        string cpf "pseudonimizado"
        string email
        enum papel "auditor|supervisor|admin"
        bool mfa_enabled
        timestamp criado_em
    }
    contribuinte {
        uuid id PK
        string cnpj_cpf "pseudonimizado"
        string razao_social
        enum situacao "ativo|inativo|suspenso"
        jsonb cadastro_mobiliario
    }
    documento_fiscal {
        uuid id PK
        uuid contribuinte_id FK
        enum tipo "NFS-e|NFe|...|"
        decimal valor
        date competencia
        jsonb payload
    }
    declaracao {
        uuid id PK
        uuid contribuinte_id FK
        enum tipo "DIMP|DEFIS|PGDAS|..."
        decimal valor_declarado
        date competencia
        jsonb payload
    }
    caso {
        uuid id PK
        uuid contribuinte_id FK
        enum tipo "subdeclaracao|omissao|informal|..."
        enum status "aberto|em_analise|notificado|regularizado|encerrado"
        decimal valor_potencial
        timestamp aberto_em
    }
    score_risco {
        uuid id PK
        uuid caso_id FK
        decimal score "0..1"
        jsonb fatores "explicabilidade"
        string modelo_versao
        timestamp calculado_em
    }
    case_decision {
        uuid id PK
        uuid caso_id FK
        uuid auditor_id FK
        enum acao "intimacao|abrir_fiscalizacao|autorregularizacao|descarte"
        text justificativa
        string correlation_id
        timestamp decidido_em
    }
    notificacao {
        uuid id PK
        uuid caso_id FK
        enum canal "email|sms|whatsapp|portal"
        enum status "pendente|enviada|lida|respondida"
        timestamp enviado_em
    }
    audit_log {
        uuid id PK
        string acao
        uuid ator_id
        string correlation_id
        jsonb payload
        timestamp registrado_em
    }
    socio {
        uuid id PK
        uuid contribuinte_id FK
        uuid socio_contribuinte_id FK
        decimal percentual
    }
```

## Tabelas de auditoria

A tabela `audit_log` é **append-only**:

- Não há `UPDATE` nem `DELETE` em produção.
- Triggers no Postgres podem bloquear esses statements como guardrail adicional.
- Retenção mínima: `audit_log_retention_days` (default: 1825 dias / 5 anos), conforme [`../compliance/politica-retencao.md`](../compliance/politica-retencao.md).

## Grafo (Apache AGE)

Camada de grafo dentro do mesmo Postgres, no schema `ag_catalog`:

- **Nós:** `Contribuinte`, `Socio`, `Endereco`, `Operacao`.
- **Arestas:** `SOCIO_DE`, `MESMO_ENDERECO`, `OPEROU_COM`, `MESMO_TELEFONE`.

Usado pelo módulo 2 para detecção de redes (centralidade, comunidades suspeitas).

## Embeddings (pgvector)

Coluna `embedding vector(1536)` em:

- `legislacao_chunk` (para o Copilot Fiscal do módulo 7).
- `evidencia_resumo` (para busca semântica em dossiês).

## Pseudonimização

Campos identificáveis (`cnpj_cpf`, `nome`) são **armazenados em claro** no banco operacional (necessário para a operação fiscal), mas:

- **Antes** de envio a LLM externo ou treinamento de modelo, aplicar `pseudonymize()` (`core/security.py`).
- **Nunca** logar campos identificáveis em níveis `INFO`/`DEBUG`.
- Em ambientes de teste e simulação (módulo 7), **sempre** dados sintéticos ou pseudonimizados.

## Migrations

Alembic gerencia o schema. Comandos:

```powershell
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "add tabela_x"
uv run alembic downgrade -1
```

Migrations já aplicadas em produção **nunca** são editadas; gere uma nova migration corretiva.
