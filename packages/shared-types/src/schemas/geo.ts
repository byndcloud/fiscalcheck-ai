import { z } from "zod";

import { SeveridadeSchema } from "./divergencia";

/*
  Geofiscalização (T21 · módulo 7 · complementar).
  Obras/imóveis com indício de divergência em construção civil,
  detectados por visão computacional (satélite/rua) e cruzados com
  NFS-e e alvarás. Coordenadas são NORMALIZADAS (0–100) sobre o mapa
  estilizado do POC — nunca latitude/longitude real de imóvel, para não
  permitir reidentificação de contribuinte (AGENTS.md §1.2).
*/

export const GeoObraTipoSchema = z.enum(["obra_nova", "ampliacao", "reforma"]);
export type GeoObraTipo = z.infer<typeof GeoObraTipoSchema>;

export const GeoFonteDeteccaoSchema = z.enum(["satelite", "street_view"]);
export type GeoFonteDeteccao = z.infer<typeof GeoFonteDeteccaoSchema>;

export const AlvaraSituacaoSchema = z.enum([
  "sem_alvara",
  "alvara_divergente",
  "alvara_compativel",
]);
export type AlvaraSituacao = z.infer<typeof AlvaraSituacaoSchema>;

export const GeoObraStatusSchema = z.enum(["novo", "caso_aberto"]);
export type GeoObraStatus = z.infer<typeof GeoObraStatusSchema>;

export const GeoDeteccaoSchema = z.object({
  fonte: GeoFonteDeteccaoSchema,
  detectadoEm: z.string(),
  /** Confiança do modelo de visão computacional (0–1). */
  confianca: z.number().min(0).max(1),
  /** O que o modelo viu, em linguagem de instrução de caso. */
  resumo: z.string().min(1),
  /** Área construída/expandida estimada pela detecção (m²). */
  areaDetectadaM2: z.number().positive(),
});
export type GeoDeteccao = z.infer<typeof GeoDeteccaoSchema>;

export const GeoAlvaraSchema = z.object({
  situacao: AlvaraSituacaoSchema,
  numero: z.string().optional(),
  /** Área licenciada no alvará vigente (m²), quando existe. */
  areaLicenciadaM2: z.number().nonnegative().optional(),
});
export type GeoAlvara = z.infer<typeof GeoAlvaraSchema>;

export const GeoObraSchema = z.object({
  id: z.string().min(1),
  contribuinteId: z.string().min(1),
  /** Endereço sintético — nunca um logradouro real de contribuinte. */
  endereco: z.string().min(1),
  bairro: z.string().min(1),
  tipo: GeoObraTipoSchema,
  /** Posição normalizada no mapa estilizado (0–100 em cada eixo). */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  deteccao: GeoDeteccaoSchema,
  alvara: GeoAlvaraSchema,
  /** NFS-e de construção civil vinculadas ao endereço (R$, 12 meses). */
  nfseConstrucao12m: z.number().nonnegative(),
  /** Valor estimado dos serviços da obra pela visão computacional (R$). */
  valorEstimadoObra: z.number().nonnegative(),
  severidade: SeveridadeSchema,
  status: GeoObraStatusSchema,
  /** Preenchido quando o auditor gera o caso candidato na fila. */
  casoId: z.string().optional(),
});
export type GeoObra = z.infer<typeof GeoObraSchema>;
