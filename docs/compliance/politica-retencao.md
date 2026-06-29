# Política de Retenção e Eliminação Segura

> Tempo que cada categoria de dado é mantida, e como é eliminada quando o prazo acaba.
>
> Base legal: LGPD art. 16; CTN art. 173 (prazo decadencial de 5 anos para constituir crédito tributário); CTN art. 174 (prescrição da ação de cobrança, 5 anos da constituição).

## Princípios

1. **Mínimo necessário** — não reter além do que a lei exige ou a operação fiscal demanda.
2. **Eliminação segura** quando o prazo termina (não basta deletar registro; backups também são tratados).
3. **Auditável** — toda eliminação é registrada no `audit_log`.

## Tabela de retenção

| Categoria | Tempo | Base | Eliminação |
|---|---|---|---|
| **NFS-e ingerida** | 5 anos | CTN art. 173/174 | Soft-delete + purge cifrado após 5 anos |
| **Declarações (DIMP, DEFIS, PGDAS)** | 5 anos | CTN art. 173/174 | Idem |
| **Cadastro mobiliário** | Enquanto contribuinte ativo + 5 anos após baixa | CTN | Idem |
| **Casos abertos (não regularizados)** | Indefinido (até decisão final) | CTN | n/a |
| **Casos regularizados** | 5 anos após regularização | CTN art. 174 | Soft-delete + purge |
| **Audit log** | **5 anos** mínimo | LGPD + CTN | Append-only; expurgo arquivado em cofre |
| **Logs de aplicação (info/debug)** | 90 dias | Boas práticas + LGPD minimização | Rotação automática |
| **Notificações ao cidadão (comprovantes)** | 5 anos após envio | CTN | Idem casos |
| **Dados do auditor (login, ações)** | Enquanto vínculo + 5 anos após desligamento | LGPD + CTN | Idem |
| **Modelos ML treinados** | Versão atual + 2 versões | Auditabilidade | Versões antigas arquivadas (sem expurgo até reauditoria) |
| **Backups completos** | 1 ano (rotação mensal) | DR + LGPD | Sobrescrita pela rotação |
| **Ambiente de simulação** | Apenas dado sintético/pseudonimizado | LGPD | n/a |

## Configuração técnica

A variável `AUDIT_LOG_RETENTION_DAYS=1825` no [`.env.example`](../../.env.example) controla o padrão; mudanças por categoria são parametrizadas em `modules/compliance/parameters/`.

## Eliminação segura

### Banco de produção

- `DELETE` operacional move para tabela `tombstone_*` (soft-delete) com timestamp.
- Job mensal de purge físico (`pg_repack` + reescrita) faz limpeza permanente após prazo.
- Sem `pg_restore` de dump antigo sobre produção (poderia ressuscitar dado expurgado).

### Backups

- Backups são cifrados (AES-256) com chave gerenciada (KMS quando em nuvem).
- Rotação: diário (mantém 30 dias), semanal (mantém 12 semanas), mensal (mantém 12 meses).
- Após 12 meses, sobrescrita garantida.

### Storage de artefatos (S3/MinIO)

- Lifecycle policy do bucket aplica expiração automática.
- Objetos com retenção legal recebem `Object Lock` (WORM).

## Quando o titular pede eliminação (LGPD art. 18, VI)

1. Avaliar se há **retenção legal**:
   - Dado fiscal sob CTN: **não pode ser eliminado** antes do prazo (justificar ao titular).
   - Dado **excedente** (que não foi usado na fiscalização): pode ser eliminado imediatamente.
2. Documentar resposta ao titular no portal + audit log.
3. Eliminar somente o subset elegível.

## Revisão

A cada 12 meses ou quando houver mudança normativa (ex.: ANPD publicar resolução nova; mudança no CTN).
