import type { CaseDocument } from "@fiscalcheck/shared-types";

/*
  Documentos gerados na cadeia decisória (termo de intimação / termo de
  início de fiscalização). Conteúdo em markdown, renderizado inline no
  drawer de detalhe. Todos os dados são sintéticos.
*/
export const caseDocumentsFixture: CaseDocument[] = [
  {
    id: "doc-2026-0001",
    casoId: "cs-2026-0128",
    kind: "termo_intimacao",
    numero: "TI-2026-0128",
    emitidoEm: "2026-06-30T18:14:00Z",
    emitidoPor: "Rodrigo Miranda (Auditor Fiscal)",
    conteudo: `# Termo de Intimação Fiscal TI-2026-0128

**Prefeitura Municipal de Brusque · Secretaria da Fazenda**

Ao contribuinte **Tecelagem Vale do Itajaí Comércio ME** (CNPJ **.***.***/0001-73), inscrição municipal 22987-1, fica intimado a apresentar, no prazo de **10 (dez) dias úteis**, contados do recebimento deste, os seguintes documentos:

1. Contratos de prestação de serviço à empresa estrangeira referente ao exercício 2026.
2. Comprovantes de fechamento de câmbio das operações declaradas como exportação.
3. Relação de NFS-e emitidas com CFPS 5.999 no período de janeiro a maio de 2026.

**Valor potencial estimado**: R$ 22.800,00 (exercício de referência 01/2025 a 05/2026).

O não atendimento no prazo ensejará abertura de procedimento de fiscalização, nos termos da legislação municipal.

**Fundamento legal**: Art. 195 do CTN c/c art. 42 da Lei Complementar Municipal nº 289/2015.

Brusque/SC, 30 de junho de 2026.
`,
  },
  {
    id: "doc-2026-0002",
    casoId: "cs-2026-0104",
    kind: "termo_inicio_fiscalizacao",
    numero: "TIF-2026-0104",
    emitidoEm: "2026-06-15T09:00:00Z",
    emitidoPor: "Ana Ferreira (Supervisora)",
    conteudo: `# Termo de Início de Fiscalização TIF-2026-0104

**Prefeitura Municipal de Brusque · Secretaria da Fazenda**

Dá-se por iniciada, nesta data, ação fiscal em face do contribuinte **Restaurante Coração Catarinense Ltda.** (CNPJ **.***.***/0001-56), inscrição municipal 70345-7, com o objetivo de verificar o cumprimento das obrigações tributárias principais e acessórias relativas ao **ISSQN** do período **01/2024 a 05/2026**.

**Valor potencial estimado**: R$ 265.400,00.

Escopo:

- Auditoria das NFS-e emitidas e apuração do ISS devido.
- Confronto com a movimentação bancária e cartões (DIMP).
- Análise de suficiência do plano de contas (ECD) e enquadramento tributário.
- Cruzamento com CT-e de fornecedores e notas de mercadoria adquirida.

O contribuinte fica cientificado dos direitos previstos no art. 5º da Lei Municipal nº 289/2015 e obrigado a apresentar, quando solicitado, livros, documentos e arquivos digitais relacionados à atividade.

Brusque/SC, 15 de junho de 2026.
`,
  },
  {
    id: "doc-2026-0003",
    casoId: "cs-2026-0126",
    kind: "termo_intimacao",
    numero: "TI-2026-0126",
    emitidoEm: "2026-06-28T15:30:00Z",
    emitidoPor: "Rodrigo Miranda (Auditor Fiscal)",
    conteudo: `# Termo de Intimação Fiscal TI-2026-0126

**Prefeitura Municipal de Brusque · Secretaria da Fazenda**

Ao contribuinte **Transportadora Rio Branco Cargas ME** (CNPJ **.***.***/0001-34), inscrição municipal 81023-5, fica intimado a apresentar, no prazo de **10 (dez) dias úteis**, os seguintes documentos:

1. Todos os CT-e emitidos no exercício 2025 acompanhados das respectivas NFS-e.
2. Relação de tomadores fora do município e comprovantes de retenção de ISS na fonte.
3. Livro Registro de Prestação de Serviços atualizado até 31/12/2025.

**Valor potencial estimado**: R$ 89.400,00 (exercício 01/2025 a 12/2025).

**Fundamento legal**: Art. 195 do CTN c/c art. 42 da Lei Complementar Municipal nº 289/2015.

Brusque/SC, 28 de junho de 2026.
`,
  },
  {
    id: "doc-2026-0004",
    casoId: "cs-2026-0099",
    kind: "termo_inicio_fiscalizacao",
    numero: "TIF-2026-0099",
    emitidoEm: "2026-06-05T11:00:00Z",
    emitidoPor: "Ana Ferreira (Supervisora)",
    conteudo: `# Termo de Início de Fiscalização TIF-2026-0099

**Prefeitura Municipal de Brusque · Secretaria da Fazenda**

Dá-se por iniciada, nesta data, ação fiscal em face do contribuinte **Imobiliária Colinas do Vale Ltda.** (CNPJ **.***.***/0001-15), inscrição municipal 10234-8, com o objetivo de verificar as obrigações tributárias relativas ao **ISSQN** do período **01/2023 a 12/2025**.

**Valor potencial estimado**: R$ 412.600,00.

Escopo:

- Reconciliação das comissões de intermediação declaradas com transações registradas no Cartório de Registro de Imóveis.
- Análise dos contratos de intermediação firmados no triênio.
- Cruzamento com ECD, DIMP e movimentação bancária.

Brusque/SC, 5 de junho de 2026.
`,
  },
];
