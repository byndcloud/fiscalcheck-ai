import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { CaseDocument, Divergencia, NFSe, NivelRisco } from "@fiscalcheck/shared-types";

import { formatCurrencyBRL } from "@/lib/format-currency";

import type { DossieData } from "./build-dossie-data";

/*
  Documento PDF do dossiê (T28 · módulo 4).

  Convenções obrigatórias:
  - Toda página carrega cabeçalho institucional + rodapé com correlation
    id (art. 198 CTN — a peça é sob sigilo fiscal).
  - CNPJ e CPF já chegam mascarados do schema — nunca desmascarar aqui.
  - Cores espelham o DS v2.0 (docs/design-system).
  - Tipografia: usamos as fontes internas do @react-pdf (Helvetica /
    Courier) intencionalmente — evita fetch de Google Fonts em runtime
    (bloqueado por CORS/AV em muitos ambientes corporativos e a causa
    mais frequente de crash da geração). As famílias do DS
    (Raleway/Montserrat) ficam reservadas para a UI web.
  - Componente é PURO: mesmo `DossieData` gera mesmo PDF byte-a-byte.
*/

const FONT_SANS = "Helvetica";
const FONT_SANS_BOLD = "Helvetica-Bold";
const FONT_MONO = "Courier";

const DS_COLORS = {
  brand: "#1351B4",
  brandDark: "#071D41",
  brandTint: "#EAF2FD",
  textStrong: "#121826",
  textMuted: "#54607A",
  border: "#E1E6F0",
  surface: "#FFFFFF",
  n25: "#F5F7FA",
  warningBg: "#FEF7E5",
  warningBorder: "#F2A900",
  warningText: "#7A5300",
  riskConforme: "#168821",
  riskBaixo: "#7FB23C",
  riskMedio: "#F2A900",
  riskAlto: "#E8590C",
  riskCritico: "#C5160B",
};

const RISK_COLOR: Record<NivelRisco, string> = {
  conforme: DS_COLORS.riskConforme,
  baixo: DS_COLORS.riskBaixo,
  medio: DS_COLORS.riskMedio,
  alto: DS_COLORS.riskAlto,
  critico: DS_COLORS.riskCritico,
};

const RISK_LABEL: Record<NivelRisco, string> = {
  conforme: "Conforme",
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

const SEVERIDADE_COLOR: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: DS_COLORS.riskConforme,
  2: DS_COLORS.riskBaixo,
  3: DS_COLORS.riskMedio,
  4: DS_COLORS.riskAlto,
  5: DS_COLORS.riskCritico,
};

const STATUS_LABEL: Record<string, string> = {
  candidato: "Candidato",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  notificado: "Notificado",
  em_autorregularizacao: "Em autorregularização",
  fiscalizacao: "Fiscalização",
  encerrado: "Encerrado",
};

const TRIBUTO_LABEL: Record<string, string> = {
  iss: "ISS",
  iptu: "IPTU",
  itbi: "ITBI",
  tld: "TLD",
  cosip: "COSIP",
};

const REGIME_LABEL: Record<string, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
};

const SITUACAO_LABEL: Record<string, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  baixada: "Baixada",
  inapta: "Inapta",
  nula: "Nula",
};

const TIPO_DIV_LABEL: Record<string, string> = {
  subdeclaracao: "Subdeclaração",
  omissao: "Omissão",
  regime_incorreto: "Regime incorreto",
  endereco_inconsistente: "Endereço inconsistente",
  socio_vinculado: "Sócio vinculado",
};

const ORIGEM_DIV_LABEL: Record<string, string> = {
  declarado_vs_nfse: "Declarado vs. NFS-e",
  grafo_socios: "Grafo de sócios",
  cadastro: "Cadastro",
  regime_incompativel: "Regime incompatível",
  atividade_incompativel: "Atividade incompatível",
};

const DOC_KIND_LABEL: Record<CaseDocument["kind"], string> = {
  termo_intimacao: "Termo de Intimação",
  termo_inicio_fiscalizacao: "Termo de Início de Fiscalização",
};

function formatDateBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDateOnlyBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 108,
    paddingBottom: 82,
    paddingHorizontal: 40,
    fontFamily: FONT_SANS,
    fontSize: 9.5,
    color: DS_COLORS.textStrong,
    lineHeight: 1.4,
    backgroundColor: DS_COLORS.surface,
  },
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: DS_COLORS.border,
    paddingBottom: 8,
  },
  headerLogo: {
    height: 32,
  },
  headerRight: {
    alignItems: "flex-end",
    flexDirection: "column",
  },
  headerAgency: {
    fontSize: 8.5,
    color: DS_COLORS.textStrong,
    fontFamily: FONT_SANS_BOLD,
  },
  headerSubtitle: {
    fontSize: 7.5,
    color: DS_COLORS.textMuted,
  },
  headerPeca: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    backgroundColor: DS_COLORS.brandTint,
    color: DS_COLORS.brandDark,
    fontSize: 7.5,
    fontFamily: FONT_MONO,
    letterSpacing: 0.4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: DS_COLORS.border,
    paddingTop: 6,
  },
  footerInstitutional: {
    fontSize: 6.5,
    color: DS_COLORS.textMuted,
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 1.35,
  },
  footerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 7,
    color: DS_COLORS.textMuted,
  },
  footerCorrelation: {
    fontFamily: FONT_MONO,
    color: DS_COLORS.textStrong,
  },
  h1: {
    fontSize: 20,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.brandDark,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: DS_COLORS.textMuted,
    fontFamily: FONT_SANS_BOLD,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  intro: {
    fontSize: 10,
    color: DS_COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 1.7,
  },
  introStrong: {
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.textStrong,
  },
  section: {
    marginTop: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DS_COLORS.border,
    padding: 12,
    backgroundColor: DS_COLORS.surface,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.brand,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  metaCell: {
    width: "50%",
    marginBottom: 6,
    paddingRight: 8,
  },
  metaLabel: {
    fontSize: 7.5,
    color: DS_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 10,
    color: DS_COLORS.textStrong,
  },
  mono: {
    fontFamily: FONT_MONO,
    color: DS_COLORS.textStrong,
  },
  bannerSigilo: {
    marginTop: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DS_COLORS.warningBorder,
    backgroundColor: DS_COLORS.warningBg,
    padding: 10,
  },
  bannerSigiloTitle: {
    fontSize: 9,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.warningText,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bannerSigiloBody: {
    fontSize: 9,
    color: DS_COLORS.warningText,
  },
  scoreBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreValue: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 40,
    color: DS_COLORS.textStrong,
    marginRight: 12,
  },
  scoreLabel: {
    fontSize: 8,
    color: DS_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreLevelChip: {
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: FONT_SANS_BOLD,
    color: "#FFFFFF",
    alignSelf: "flex-start",
  },
  table: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: DS_COLORS.border,
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: DS_COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHead: {
    backgroundColor: DS_COLORS.n25,
    fontSize: 8,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableCell: {
    fontSize: 9,
    color: DS_COLORS.textStrong,
    paddingRight: 6,
  },
  chipSeveridade: {
    fontSize: 8,
    fontFamily: FONT_SANS_BOLD,
    color: "#FFFFFF",
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  divRow: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: DS_COLORS.border,
  },
  divRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  divHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  divTitle: {
    fontSize: 10,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.textStrong,
  },
  divMeta: {
    fontSize: 8,
    color: DS_COLORS.textMuted,
    marginBottom: 2,
  },
  divDescricao: {
    fontSize: 9,
    color: DS_COLORS.textStrong,
    marginTop: 2,
  },
  divValor: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 11,
    color: DS_COLORS.textStrong,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: DS_COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalValue: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 14,
    color: DS_COLORS.brandDark,
  },
  timelineItem: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: DS_COLORS.brand,
  },
  timelineWhen: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: DS_COLORS.textMuted,
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 10,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.textStrong,
  },
  timelineSubtitle: {
    fontSize: 8.5,
    color: DS_COLORS.textMuted,
  },
  timelineJust: {
    fontSize: 9,
    marginTop: 3,
    color: DS_COLORS.textStrong,
    fontStyle: "italic",
  },
  recomendacaoTitle: {
    fontSize: 11,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.brandDark,
    marginBottom: 3,
  },
  recomendacaoJust: {
    fontSize: 9.5,
    color: DS_COLORS.textStrong,
    marginBottom: 6,
  },
  recomendacaoMeta: {
    fontSize: 8,
    color: DS_COLORS.textMuted,
  },
  socioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: DS_COLORS.border,
    paddingVertical: 3,
  },
  emptyState: {
    fontSize: 9,
    color: DS_COLORS.textMuted,
    fontStyle: "italic",
  },
  signatureBox: {
    marginTop: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: DS_COLORS.border,
    borderRadius: 4,
    backgroundColor: DS_COLORS.n25,
  },
  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  signatureTitle: {
    fontSize: 9,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.brand,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  signatureSeal: {
    borderWidth: 1,
    borderColor: DS_COLORS.brand,
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 7,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.brand,
    letterSpacing: 0.6,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: DS_COLORS.textStrong,
    marginTop: 32,
    paddingTop: 4,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: FONT_SANS_BOLD,
    color: DS_COLORS.textStrong,
  },
  signatureRole: {
    fontSize: 8.5,
    color: DS_COLORS.textMuted,
  },
  signatureMeta: {
    fontSize: 7.5,
    color: DS_COLORS.textMuted,
    marginTop: 8,
    lineHeight: 1.5,
  },
});

/*
  Dados institucionais da Secretaria da Fazenda de Brusque impressos
  no rodapé de todas as páginas. Mantidos como constantes locais para
  facilitar a mudança futura (basta editar aqui). Fontes:
  https://www.brusque.sc.gov.br/portal-municipal/secretarias/fazenda
*/
const ORGAO_NOME = "Prefeitura Municipal de Brusque · Secretaria da Fazenda";
const ORGAO_ENDERECO = "Praça das Bandeiras, 77 · Centro · Brusque/SC · CEP 88350-110";
const ORGAO_CONTATO = "fazenda@brusque.sc.gov.br · (47) 3211-7000";

type PageChromeProps = {
  logoSrc: string | null;
  emittedAt: string;
  correlationId: string;
  numeroPeca: string;
};

function PageChrome({ logoSrc, emittedAt, correlationId, numeroPeca }: PageChromeProps) {
  return (
    <>
      <View style={styles.header} fixed>
        {logoSrc ? (
          <Image src={logoSrc} style={styles.headerLogo} />
        ) : (
          <Text style={{ fontFamily: FONT_SANS_BOLD, fontSize: 12, color: DS_COLORS.brand }}>
            FiscalCheck AI
          </Text>
        )}
        <View style={styles.headerRight}>
          <Text style={styles.headerAgency}>
            Prefeitura Municipal de Brusque · Secretaria da Fazenda
          </Text>
          <Text style={styles.headerSubtitle}>FiscalCheck AI — Instrução do Caso</Text>
          <Text style={styles.headerPeca}>Peça nº {numeroPeca}</Text>
        </View>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerInstitutional}>
          {ORGAO_NOME}
          {"\n"}
          {ORGAO_ENDERECO} · {ORGAO_CONTATO}
        </Text>
        <View style={styles.footerMeta}>
          <Text>Emitido em {formatDateBR(emittedAt)}</Text>
          <Text style={styles.footerCorrelation}>cid {correlationId}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </View>
    </>
  );
}

function SigiloBanner() {
  return (
    <View style={styles.bannerSigilo}>
      <Text style={styles.bannerSigiloTitle}>Documento sob sigilo fiscal</Text>
      <Text style={styles.bannerSigiloBody}>
        Peça processual contendo dados protegidos por sigilo fiscal (art. 198 do CTN) e LGPD (Lei
        13.709/2018). O uso é restrito ao Fisco Municipal de Brusque/SC e ao contribuinte titular. A
        divulgação a terceiros sem autorização legal é vedada e sujeita o infrator às penalidades
        cabíveis.
      </Text>
    </View>
  );
}

function DivergenciaBlock({
  divergencias,
  somaDivergencias,
  potencial,
}: {
  divergencias: DossieData["divergencias"];
  somaDivergencias: number;
  potencial: number | null;
}) {
  if (divergencias.length === 0) {
    return (
      <Text style={styles.emptyState}>
        Nenhuma divergência vinculada — caso encerrado ou sem apontamentos.
      </Text>
    );
  }

  return (
    <>
      {divergencias.map((d, idx) => (
        <View
          key={d.id}
          style={[styles.divRow, idx === divergencias.length - 1 ? styles.divRowLast : {}]}
          wrap={false}
        >
          <View style={styles.divHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.chipSeveridade,
                  {
                    backgroundColor:
                      SEVERIDADE_COLOR[d.severidade as 1 | 2 | 3 | 4 | 5] ?? DS_COLORS.textMuted,
                    marginRight: 6,
                  },
                ]}
              >
                <Text>Sev. {d.severidade}</Text>
              </View>
              <Text style={styles.divTitle}>{TIPO_DIV_LABEL[d.tipo] ?? d.tipo}</Text>
            </View>
            <Text style={styles.divValor}>{formatCurrencyBRL(d.valor ?? null)}</Text>
          </View>
          <Text style={styles.divMeta}>
            <Text style={styles.mono}>{d.id}</Text>
            {" · "}
            Origem: {ORIGEM_DIV_LABEL[d.origem] ?? d.origem}
            {d.competencia ? ` · Competência ${d.competencia}` : ""}
            {" · Detectado em "}
            {formatDateOnlyBR(d.detectadoEm)}
          </Text>
          <Text style={styles.divDescricao}>{d.descricao}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total apurado nas divergências</Text>
        <Text style={styles.totalValue}>{formatCurrencyBRL(somaDivergencias)}</Text>
      </View>
      {potencial !== null && potencial > 0 ? (
        <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.totalLabel}>Valor potencial estimado no caso</Text>
          <Text style={styles.divValor}>{formatCurrencyBRL(potencial)}</Text>
        </View>
      ) : null}
    </>
  );
}

function ScoreBlock({ score }: { score: DossieData["score"] }) {
  if (!score) {
    return <Text style={styles.emptyState}>Score não disponível para este contribuinte.</Text>;
  }
  return (
    <>
      <View style={styles.scoreBlock}>
        <Text style={styles.scoreValue}>{Math.round(score.valor)}</Text>
        <View>
          <Text style={styles.scoreLabel}>Score de risco</Text>
          <Text style={[styles.scoreLevelChip, { backgroundColor: RISK_COLOR[score.nivel] }]}>
            {RISK_LABEL[score.nivel]}
          </Text>
          <Text style={{ fontSize: 8, color: DS_COLORS.textMuted, marginTop: 4 }}>
            Modelo <Text style={styles.mono}>{score.modeloVersao}</Text> · Calculado em{" "}
            {formatDateBR(score.calculadoEm)}
          </Text>
        </View>
      </View>

      <Text style={[styles.eyebrow, { marginTop: 6 }]}>Fatores (XAI)</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHead]}>
          <Text style={[styles.tableCell, { width: "40%" }]}>Fator</Text>
          <Text style={[styles.tableCell, { width: "12%", textAlign: "right" }]}>Peso</Text>
          <Text style={[styles.tableCell, { width: "18%", textAlign: "right" }]}>Contribuição</Text>
          <Text style={[styles.tableCell, { width: "30%" }]}>Origem · evidência</Text>
        </View>
        {score.fatores.map((f, idx) => (
          <View
            key={`${f.nome}-${idx}`}
            style={[styles.tableRow, idx === score.fatores.length - 1 ? styles.tableRowLast : {}]}
            wrap={false}
          >
            <Text style={[styles.tableCell, { width: "40%" }]}>{f.nome}</Text>
            <Text style={[styles.tableCell, styles.mono, { width: "12%", textAlign: "right" }]}>
              {f.peso.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.mono, { width: "18%", textAlign: "right" }]}>
              {f.contribuicao >= 0 ? "+" : ""}
              {f.contribuicao.toFixed(2)}
            </Text>
            <Text
              style={[styles.tableCell, { width: "30%", fontSize: 8 }]}
            >{`${f.origem} · ${f.evidencia}`}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function EvidenciasBlock({
  evidencias,
  divergencias,
}: {
  evidencias: NFSe[];
  divergencias: Divergencia[];
}) {
  const totalMencionadas = new Set(divergencias.flatMap((d) => d.evidencias ?? [])).size;

  if (evidencias.length === 0) {
    return (
      <Text style={styles.emptyState}>
        {totalMencionadas === 0
          ? "Nenhuma evidência de NFS-e vinculada às divergências deste caso."
          : `Nenhuma NFS-e detalhada disponível no mock (${totalMencionadas} referência(s) citada(s) pelas divergências).`}
      </Text>
    );
  }

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHead]}>
        <Text style={[styles.tableCell, { width: "14%" }]}>Nº NFS-e</Text>
        <Text style={[styles.tableCell, { width: "12%" }]}>Competência</Text>
        <Text style={[styles.tableCell, { width: "14%" }]}>Emissão</Text>
        <Text style={[styles.tableCell, { width: "18%", textAlign: "right" }]}>Valor serviços</Text>
        <Text style={[styles.tableCell, { width: "10%", textAlign: "right" }]}>Alíquota</Text>
        <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>ISS</Text>
        <Text style={[styles.tableCell, { width: "18%" }]}>Situação</Text>
      </View>
      {evidencias.map((n, idx) => (
        <View
          key={n.id}
          style={[styles.tableRow, idx === evidencias.length - 1 ? styles.tableRowLast : {}]}
          wrap={false}
        >
          <Text style={[styles.tableCell, styles.mono, { width: "14%" }]}>{n.numero}</Text>
          <Text style={[styles.tableCell, styles.mono, { width: "12%" }]}>{n.competencia}</Text>
          <Text style={[styles.tableCell, { width: "14%" }]}>
            {formatDateOnlyBR(n.dataEmissao)}
          </Text>
          <Text style={[styles.tableCell, styles.mono, { width: "18%", textAlign: "right" }]}>
            {formatCurrencyBRL(n.valorServicos)}
          </Text>
          <Text style={[styles.tableCell, styles.mono, { width: "10%", textAlign: "right" }]}>
            {n.aliquota.toFixed(2)}%
          </Text>
          <Text style={[styles.tableCell, styles.mono, { width: "14%", textAlign: "right" }]}>
            {formatCurrencyBRL(n.iss)}
          </Text>
          <Text style={[styles.tableCell, { width: "18%", fontSize: 8 }]}>{n.situacao}</Text>
        </View>
      ))}
    </View>
  );
}

function TimelineBlock({ timeline }: { timeline: DossieData["timeline"] }) {
  if (timeline.length === 0) {
    return (
      <Text style={styles.emptyState}>
        Ainda não há decisões ou termos registrados para este caso.
      </Text>
    );
  }
  return (
    <>
      {timeline.map((item) => (
        <View key={`${item.kind}-${item.correlationId}`} style={styles.timelineItem} wrap={false}>
          <Text style={styles.timelineWhen}>{formatDateBR(item.timestamp)}</Text>
          <Text style={styles.timelineTitle}>{item.titulo}</Text>
          <Text style={styles.timelineSubtitle}>
            {item.subtitulo} · por {item.atorNome} ({item.atorPapel})
          </Text>
          {item.kind === "decision" && item.justificativa ? (
            <Text style={styles.timelineJust}>&ldquo;{item.justificativa}&rdquo;</Text>
          ) : null}
          <Text style={[styles.timelineWhen, { marginTop: 2 }]}>
            ref <Text style={styles.mono}>{item.correlationId}</Text>
          </Text>
        </View>
      ))}
    </>
  );
}

function DecisaoAuditorBlock({ decisions }: { decisions: DossieData["decisions"] }) {
  const ultimaDecisao = decisions[0];
  if (!ultimaDecisao) {
    return (
      <Text style={styles.emptyState}>
        Nenhuma decisão do auditor registrada — caso ainda em análise.
      </Text>
    );
  }
  const acaoLabel: Record<typeof ultimaDecisao.action, string> = {
    aprovar: "Aprovada",
    ajustar: "Ajuste solicitado",
    rejeitar: "Rejeitada",
  };
  return (
    <>
      <Text style={styles.recomendacaoTitle}>
        Decisão do auditor: {acaoLabel[ultimaDecisao.action]}
      </Text>
      <Text style={styles.recomendacaoMeta}>
        {ultimaDecisao.atorNome} · {ultimaDecisao.atorPapel} ·{" "}
        {formatDateBR(ultimaDecisao.timestamp)}
      </Text>
      {ultimaDecisao.justificativa ? (
        <Text style={[styles.recomendacaoJust, { marginTop: 6 }]}>
          &ldquo;{ultimaDecisao.justificativa}&rdquo;
        </Text>
      ) : null}
      <Text style={styles.recomendacaoMeta}>
        Transição: {ultimaDecisao.statusAnterior} → {ultimaDecisao.statusPosterior}
        {ultimaDecisao.documentoGerado
          ? ` · Documento gerado: ${ultimaDecisao.documentoGerado}`
          : ""}
        {" · correlation "}
        <Text style={styles.mono}>{ultimaDecisao.correlationId}</Text>
      </Text>
    </>
  );
}

type DossiePdfDocumentProps = {
  data: DossieData;
  /*
    O logo é passado JÁ COMO data URL (base64) para evitar que o motor
    do @react-pdf tente fazer fetch do asset em runtime — em ambientes
    corporativos esse fetch pode falhar por CORS/AV e derrubar toda a
    geração do PDF. Se o carregamento do logo falhar antes de chegar
    aqui, passamos `null` e o header renderiza um placeholder textual.
  */
  logoSrc: string | null;
};

export function DossiePdfDocument({ data, logoSrc }: DossiePdfDocumentProps) {
  const {
    caso,
    contribuinte,
    score,
    divergencias,
    evidencias,
    decisions,
    documents,
    timeline,
    valores,
    auditor,
    emittedAt,
    correlationId,
    numeroPeca,
  } = data;

  const chromeProps: PageChromeProps = { logoSrc, emittedAt, correlationId, numeroPeca };

  return (
    <Document
      title={`Peça ${numeroPeca} — Instrução do Caso ${caso.id.toUpperCase()}`}
      author={auditor.displayName}
      subject="Peça processual de instrução do caso fiscal"
      creator="FiscalCheck AI"
      producer="FiscalCheck AI"
    >
      <Page size="A4" style={styles.page}>
        <PageChrome {...chromeProps} />

        <Text style={styles.eyebrow}>
          Peça processual {numeroPeca} · Módulo 4 · Gestão da fiscalização
        </Text>
        <Text style={styles.h1}>Instrução do Caso {caso.id.toUpperCase()}</Text>
        <Text style={styles.intro}>
          Peça <Text style={styles.introStrong}>{numeroPeca}</Text> emitida por{" "}
          <Text style={styles.introStrong}>{auditor.displayName}</Text> ({auditor.role}) para servir
          como documento anexável à ação fiscal instaurada pela Secretaria da Fazenda de Brusque/SC.
        </Text>

        <SigiloBanner />

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>1 · Identificação do caso</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>ID do caso</Text>
              <Text style={[styles.metaValue, styles.mono]}>{caso.id.toUpperCase()}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{STATUS_LABEL[caso.status] ?? caso.status}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Tributo</Text>
              <Text style={styles.metaValue}>
                {caso.tributo ? (TRIBUTO_LABEL[caso.tributo] ?? caso.tributo) : "—"}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Período de apuração</Text>
              <Text style={[styles.metaValue, styles.mono]}>{caso.periodoApuracao ?? "—"}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Aberto em</Text>
              <Text style={styles.metaValue}>{formatDateBR(caso.criadoEm)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Prazo limite</Text>
              <Text style={styles.metaValue}>
                {caso.prazoLimite ? formatDateOnlyBR(caso.prazoLimite) : "—"}
              </Text>
            </View>
          </View>
        </View>

        {contribuinte ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>2 · Identificação do contribuinte</Text>
            <View style={styles.metaGrid}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Razão social</Text>
                <Text style={styles.metaValue}>{contribuinte.razaoSocial}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>CNPJ (mascarado)</Text>
                <Text style={[styles.metaValue, styles.mono]}>{contribuinte.cnpjMascarado}</Text>
              </View>
              {contribuinte.nomeFantasia ? (
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Nome fantasia</Text>
                  <Text style={styles.metaValue}>{contribuinte.nomeFantasia}</Text>
                </View>
              ) : null}
              {contribuinte.inscricaoMunicipal ? (
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Inscrição municipal</Text>
                  <Text style={[styles.metaValue, styles.mono]}>
                    {contribuinte.inscricaoMunicipal}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Regime</Text>
                <Text style={styles.metaValue}>
                  {REGIME_LABEL[contribuinte.regime] ?? contribuinte.regime}
                </Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Situação cadastral</Text>
                <Text style={styles.metaValue}>
                  {SITUACAO_LABEL[contribuinte.situacao] ?? contribuinte.situacao}
                </Text>
              </View>
              <View style={[styles.metaCell, { width: "100%" }]}>
                <Text style={styles.metaLabel}>Atividade principal</Text>
                <Text style={styles.metaValue}>{contribuinte.atividadePrincipal ?? "—"}</Text>
              </View>
              <View style={[styles.metaCell, { width: "100%" }]}>
                <Text style={styles.metaLabel}>Endereço</Text>
                <Text style={styles.metaValue}>
                  {contribuinte.endereco
                    ? `${contribuinte.endereco}, ${contribuinte.municipio}/${contribuinte.uf}`
                    : `${contribuinte.municipio}/${contribuinte.uf}`}
                </Text>
              </View>
            </View>

            {contribuinte.socios && contribuinte.socios.length > 0 ? (
              <>
                <Text style={[styles.eyebrow, { marginTop: 8 }]}>
                  Quadro societário (CPF mascarado)
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHead]}>
                    <Text style={[styles.tableCell, { width: "28%" }]}>Sócio</Text>
                    <Text style={[styles.tableCell, { width: "20%" }]}>CPF</Text>
                    <Text style={[styles.tableCell, { width: "28%" }]}>Qualificação</Text>
                    <Text style={[styles.tableCell, { width: "14%" }]}>Sócio desde</Text>
                    <Text style={[styles.tableCell, { width: "10%", textAlign: "right" }]}>%</Text>
                  </View>
                  {contribuinte.socios.map((s, idx) => (
                    <View
                      key={`${s.nome}-${idx}`}
                      style={[
                        styles.tableRow,
                        idx === (contribuinte.socios?.length ?? 0) - 1 ? styles.tableRowLast : {},
                      ]}
                      wrap={false}
                    >
                      <Text style={[styles.tableCell, { width: "28%" }]}>{s.nome}</Text>
                      <Text style={[styles.tableCell, styles.mono, { width: "20%" }]}>
                        {s.cpfMascarado}
                      </Text>
                      <Text style={[styles.tableCell, { width: "28%", fontSize: 8.5 }]}>
                        {s.qualificacao ?? "—"}
                      </Text>
                      <Text style={[styles.tableCell, styles.mono, { width: "14%", fontSize: 8 }]}>
                        {s.entradaEm ? formatDateOnlyBR(s.entradaEm) : "—"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.mono,
                          { width: "10%", textAlign: "right" },
                        ]}
                      >
                        {s.participacao}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 · Divergências apuradas</Text>
          <DivergenciaBlock
            divergencias={divergencias}
            somaDivergencias={valores.somaDivergencias}
            potencial={valores.potencial}
          />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome {...chromeProps} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4 · Score e explicabilidade</Text>
          <ScoreBlock score={score} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5 · Evidências (NFS-e)</Text>
          <EvidenciasBlock evidencias={evidencias} divergencias={divergencias} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6 · Recomendação do agente</Text>
          {caso.recomendacao ? (
            <>
              <Text style={styles.recomendacaoTitle}>{caso.recomendacao.acao}</Text>
              <Text style={styles.recomendacaoJust}>{caso.recomendacao.justificativa}</Text>
              <Text style={styles.recomendacaoMeta}>
                Confiança: {(caso.recomendacao.confianca * 100).toFixed(0)}%
                {caso.recomendacao.baseadaEm.length > 0
                  ? ` · Baseada em: ${caso.recomendacao.baseadaEm.join(", ")}`
                  : ""}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyState}>
              Nenhuma recomendação estruturada emitida para este caso.
            </Text>
          )}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome {...chromeProps} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7 · Linha do tempo</Text>
          <TimelineBlock timeline={timeline} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8 · Decisão do auditor</Text>
          <DecisaoAuditorBlock decisions={decisions} />
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>9 · Termos processuais anexados</Text>
          {documents.length === 0 ? (
            <Text style={styles.emptyState}>Nenhum termo emitido até o momento.</Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={[styles.tableCell, { width: "22%" }]}>Número</Text>
                <Text style={[styles.tableCell, { width: "34%" }]}>Tipo</Text>
                <Text style={[styles.tableCell, { width: "22%" }]}>Emissão</Text>
                <Text style={[styles.tableCell, { width: "22%" }]}>Emitido por</Text>
              </View>
              {documents.map((doc, idx) => (
                <View
                  key={doc.id}
                  style={[styles.tableRow, idx === documents.length - 1 ? styles.tableRowLast : {}]}
                  wrap={false}
                >
                  <Text style={[styles.tableCell, styles.mono, { width: "22%" }]}>
                    {doc.numero}
                  </Text>
                  <Text style={[styles.tableCell, { width: "34%" }]}>
                    {DOC_KIND_LABEL[doc.kind]}
                  </Text>
                  <Text style={[styles.tableCell, { width: "22%" }]}>
                    {formatDateBR(doc.emitidoEm)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "22%", fontSize: 8 }]}>
                    {doc.emitidoPor}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.signatureBox} wrap={false}>
          <View style={styles.signatureHeader}>
            <Text style={styles.signatureTitle}>10 · Assinatura eletrônica do auditor</Text>
            <Text style={styles.signatureSeal}>ASSINADO ELETRONICAMENTE</Text>
          </View>
          <Text style={{ fontSize: 8.5, color: DS_COLORS.textMuted }}>
            Documento assinado eletronicamente por{" "}
            <Text style={{ fontFamily: FONT_SANS_BOLD, color: DS_COLORS.textStrong }}>
              {auditor.displayName}
            </Text>{" "}
            ({auditor.role}), em {formatDateBR(emittedAt)}, com base em autenticação MFA registrada
            na sessão do FiscalCheck AI.
          </Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{auditor.displayName}</Text>
            <Text style={styles.signatureRole}>{auditor.role} · Matrícula funcional interna</Text>
          </View>
          <Text style={styles.signatureMeta}>
            Verificação de integridade: a autenticidade desta peça pode ser conferida na trilha de
            auditoria do FiscalCheck AI (módulo 6 · T19) pelo correlation id{" "}
            <Text style={styles.mono}>{correlationId}</Text>. Peça nº{" "}
            <Text style={styles.mono}>{numeroPeca}</Text>.{"\n"}
            Qualquer alteração posterior invalida a assinatura acima.
          </Text>
        </View>

        <View style={{ marginTop: 14 }} wrap={false}>
          <Text style={styles.eyebrow}>Certificação da exportação</Text>
          <Text style={{ fontSize: 8.5, color: DS_COLORS.textMuted }}>
            Esta peça foi registrada na trilha de auditoria (T19) com o correlation id{" "}
            <Text style={styles.mono}>{correlationId}</Text> no mesmo instante da geração deste
            documento, permitindo verificar autenticidade contra o registro auditável do sistema.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
