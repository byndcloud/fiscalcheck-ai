import type { AlvaraSituacao, GeoFonteDeteccao, GeoObraTipo } from "@fiscalcheck/shared-types";

/*
  Vocabulário pt-BR da Geofiscalização (T21 · módulo 7) — centralizado
  para mapa, popup, painel comparativo e filtros usarem o mesmo rótulo.
*/

export const OBRA_TIPO_LABEL: Record<GeoObraTipo, string> = {
  obra_nova: "Obra nova",
  ampliacao: "Ampliação",
  reforma: "Reforma",
};

export const FONTE_DETECCAO_LABEL: Record<GeoFonteDeteccao, string> = {
  satelite: "Satélite",
  street_view: "Imagens de rua",
};

export const ALVARA_SITUACAO_LABEL: Record<AlvaraSituacao, string> = {
  sem_alvara: "Sem alvará",
  alvara_divergente: "Alvará divergente",
  alvara_compativel: "Alvará compatível",
};
