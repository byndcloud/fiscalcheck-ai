import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatCurrencyBRL } from "@/lib/format-currency";

import { REPORT_SECOES_LABEL, type ReportData } from "./types";

/*
  Documento PDF do relatório gerencial (T17 · módulo 5).
  Reusa o mesmo motor do dossiê (@react-pdf/renderer), com layout
  simplificado — o objetivo aqui é rastreabilidade do piloto, não
  peça processual.

  Fontes internas (Helvetica) pelas mesmas razões do dossiê (evitar
  fetch de Google Fonts em runtime).
*/

const DS = {
  brand: "#1351B4",
  brandDark: "#071D41",
  brandTint: "#EAF2FD",
  textStrong: "#121826",
  textMuted: "#54607A",
  border: "#E1E6F0",
  n25: "#F5F7FA",
  ok: "#168821",
  warn: "#F2A900",
  bad: "#C5160B",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DS.textStrong,
    lineHeight: 1.4,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
    paddingBottom: 12,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1,
    color: DS.brand,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  h1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: DS.brandDark,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 10,
    color: DS.textMuted,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  metaLine: {
    fontSize: 8,
    color: DS.textMuted,
    fontFamily: "Courier",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: DS.brandDark,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
    paddingBottom: 4,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 6,
    padding: 8,
    backgroundColor: DS.n25,
  },
  kpiLabel: {
    fontSize: 8,
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DS.textStrong,
  },
  kpiVar: {
    fontSize: 8,
    color: DS.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
    paddingVertical: 6,
  },
  metaCell: {
    fontSize: 10,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DS.brandDark,
    backgroundColor: DS.brandTint,
  },
  susSummary: {
    padding: 8,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: DS.border,
    paddingTop: 6,
    fontSize: 7,
    color: DS.textMuted,
    fontFamily: "Courier",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const STATUS_COLOR: Record<string, string> = {
  no_alvo: DS.ok,
  em_risco: DS.warn,
  critico: DS.bad,
};

function formatKpi(value: number, unidade: string): string {
  if (unidade === "brl") return formatCurrencyBRL(value);
  if (unidade === "pct") return `${Math.round(value * 100)}%`;
  if (unidade === "score") return value.toFixed(1);
  return String(value);
}

function formatVar(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatMeta(value: number, unidade: string): string {
  if (unidade === "pct") return `${Math.round(value * 100)}%`;
  if (unidade === "score") return value.toFixed(1);
  return value.toFixed(1);
}

function ptBrDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

type Props = {
  data: ReportData;
};

export function GerencialPdfReport({ data }: Props) {
  const has = (key: string) => data.secoes.includes(key as never);

  return (
    <Document
      title={data.titulo}
      author={data.emitidoPor.displayName}
      subject="Relatório Gerencial FiscalCheck AI"
      producer="FiscalCheck AI"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.eyebrow}>FiscalCheck AI · Painel do Gestor</Text>
          <Text style={styles.h1}>{data.titulo}</Text>
          <Text style={styles.subtitle}>{data.subtitulo}</Text>
          <Text style={styles.metaLine}>
            Emitido por {data.emitidoPor.displayName} ({data.emitidoPor.role}) em{" "}
            {ptBrDate(data.emitidoEm)} · Período {ptBrDate(data.periodo.inicio)} a{" "}
            {ptBrDate(data.periodo.fim)}
          </Text>
        </View>

        {has("kpis") && data.kpis.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{REPORT_SECOES_LABEL.kpis}</Text>
            <View style={styles.kpiGrid}>
              {data.kpis.map((k) => (
                <View key={k.key} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiValue}>{formatKpi(k.valor, k.unidade)}</Text>
                  <Text style={styles.kpiVar}>
                    Variação {formatVar(k.variacaoPct)}
                    {k.sub ? ` · ${k.sub}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {has("metas") && data.metas.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{REPORT_SECOES_LABEL.metas}</Text>
            {data.metas.map((m) => (
              <View key={m.id} style={styles.metaRow}>
                <View>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{m.nome}</Text>
                  <Text style={{ ...styles.metaCell, color: DS.textMuted, fontSize: 8 }}>
                    baseline {formatMeta(m.baseline, m.unidade)} → atual{" "}
                    {formatMeta(m.atual, m.unidade)} / alvo {formatMeta(m.alvo, m.unidade)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text
                    style={{
                      ...styles.pill,
                      color: STATUS_COLOR[m.status] ?? DS.brandDark,
                    }}
                  >
                    {m.status.toUpperCase()}
                  </Text>
                  <Text style={{ ...styles.metaCell, color: DS.textMuted, fontSize: 8 }}>
                    Progresso {Math.round(m.progressoPct * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {has("sus") ? (
          <>
            <Text style={styles.sectionTitle}>{REPORT_SECOES_LABEL.sus}</Text>
            <View style={styles.susSummary}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
                Score médio SUS: {data.susMedia.toFixed(1)}
              </Text>
              <Text style={{ color: DS.textMuted, fontSize: 8 }}>
                {data.susAvaliacoes.length}{" "}
                {data.susAvaliacoes.length === 1
                  ? "avaliação registrada"
                  : "avaliações registradas"}
                . Limiar clássico de aceitação: 68.
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Correlation {data.correlationId}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
