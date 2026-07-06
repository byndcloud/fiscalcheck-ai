import type { GeoObra } from "@fiscalcheck/shared-types";

/*
  Geofiscalização (T21 · módulo 7) — obras/imóveis sintéticos com
  indício de divergência em construção civil.

  Nenhum dado real: endereços fictícios, coordenadas NORMALIZADAS sobre
  o mapa estilizado do POC (não são lat/long) e valores inventados
  (AGENTS.md §1.2 — sigilo fiscal + LGPD). `contribuinteId` referencia
  a fixture de contribuintes; os dois pins com `caso_aberto` apontam
  para casos reais da fixture do módulo 4 (aceite: clicar no pin navega
  ao caso).
*/
export const geoObrasFixture: GeoObra[] = [
  {
    id: "og-001",
    contribuinteId: "ct-003",
    endereco: "Rua Fictícia das Palmeiras, 480",
    bairro: "Santa Terezinha",
    tipo: "ampliacao",
    x: 28,
    y: 38,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-18",
      confianca: 0.93,
      resumo:
        "Comparativo de cenas 03/2025 × 06/2026 indica novo galpão anexo de ~850 m² ao parque fabril existente.",
      areaDetectadaM2: 1450,
    },
    alvara: {
      situacao: "alvara_divergente",
      numero: "ALV-2025-0812",
      areaLicenciadaM2: 600,
    },
    nfseConstrucao12m: 85_000,
    valorEstimadoObra: 720_000,
    severidade: 4,
    status: "caso_aberto",
    casoId: "cs-2026-0143",
  },
  {
    id: "og-002",
    contribuinteId: "ct-001",
    endereco: "Rodovia Fictícia BR-000, km 12",
    bairro: "Limeira",
    tipo: "obra_nova",
    x: 86,
    y: 46,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-22",
      confianca: 0.97,
      resumo:
        "Edificação industrial nova de grande porte em terreno vinculado ao contribuinte, sem registro de licenciamento localizado.",
      areaDetectadaM2: 2300,
    },
    alvara: {
      situacao: "sem_alvara",
    },
    nfseConstrucao12m: 0,
    valorEstimadoObra: 980_000,
    severidade: 5,
    status: "novo",
  },
  {
    id: "og-003",
    contribuinteId: "ct-013",
    endereco: "Avenida Fictícia Central, 1020",
    bairro: "Centro",
    tipo: "reforma",
    x: 48,
    y: 57,
    deteccao: {
      fonte: "street_view",
      detectadoEm: "2026-06-10",
      confianca: 0.84,
      resumo:
        "Imagens de rua mostram acréscimo de pavimento e fachada nova em imóvel comercial; alvará vigente cobre apenas reforma interna.",
      areaDetectadaM2: 420,
    },
    alvara: {
      situacao: "alvara_divergente",
      numero: "ALV-2026-0134",
      areaLicenciadaM2: 180,
    },
    nfseConstrucao12m: 32_000,
    valorEstimadoObra: 310_000,
    severidade: 3,
    status: "caso_aberto",
    casoId: "cs-2026-0148",
  },
  {
    id: "og-004",
    contribuinteId: "ct-006",
    endereco: "Rua Fictícia dos Teares, 77",
    bairro: "Guarani",
    tipo: "ampliacao",
    x: 78,
    y: 64,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-25",
      confianca: 0.91,
      resumo:
        "Expansão lateral do galpão têxtil (~520 m²) concluída entre 01/2026 e 06/2026, sem alvará de ampliação localizado.",
      areaDetectadaM2: 520,
    },
    alvara: {
      situacao: "sem_alvara",
    },
    nfseConstrucao12m: 18_000,
    valorEstimadoObra: 460_000,
    severidade: 4,
    status: "novo",
  },
  {
    id: "og-005",
    contribuinteId: "ct-002",
    endereco: "Rua Fictícia do Vale, 233",
    bairro: "Águas Claras",
    tipo: "reforma",
    x: 66,
    y: 33,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-08",
      confianca: 0.81,
      resumo:
        "Troca completa de cobertura e nova área de carga; alvará compatível, mas NFS-e de construção muito abaixo do porte da obra.",
      areaDetectadaM2: 380,
    },
    alvara: {
      situacao: "alvara_compativel",
      numero: "ALV-2026-0290",
      areaLicenciadaM2: 400,
    },
    nfseConstrucao12m: 12_000,
    valorEstimadoObra: 240_000,
    severidade: 3,
    status: "novo",
  },
  {
    id: "og-006",
    contribuinteId: "ct-010",
    endereco: "Rua Fictícia das Araucárias, 940",
    bairro: "Águas Claras",
    tipo: "obra_nova",
    x: 72,
    y: 26,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-27",
      confianca: 0.95,
      resumo:
        "Condomínio de galpões modulares em fase de acabamento; nenhuma NFS-e de construção civil vinculada ao terreno.",
      areaDetectadaM2: 1800,
    },
    alvara: {
      situacao: "sem_alvara",
    },
    nfseConstrucao12m: 0,
    valorEstimadoObra: 1_250_000,
    severidade: 5,
    status: "novo",
  },
  {
    id: "og-007",
    contribuinteId: "ct-008",
    endereco: "Travessa Fictícia Azambuja, 15",
    bairro: "Azambuja",
    tipo: "reforma",
    x: 21,
    y: 69,
    deteccao: {
      fonte: "street_view",
      detectadoEm: "2026-05-30",
      confianca: 0.76,
      resumo:
        "Fachada e acessos reformados em imóvel de serviços; área licenciada menor que a intervenção aparente.",
      areaDetectadaM2: 160,
    },
    alvara: {
      situacao: "alvara_divergente",
      numero: "ALV-2026-0071",
      areaLicenciadaM2: 90,
    },
    nfseConstrucao12m: 22_000,
    valorEstimadoObra: 95_000,
    severidade: 2,
    status: "novo",
  },
  {
    id: "og-008",
    contribuinteId: "ct-015",
    endereco: "Rua Fictícia São Pedro, 501",
    bairro: "São Pedro",
    tipo: "ampliacao",
    x: 63,
    y: 76,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-20",
      confianca: 0.89,
      resumo:
        "Ampliação de pátio coberto (~640 m²) sobre área permeável; sem alvará de ampliação e sem ART vinculada.",
      areaDetectadaM2: 640,
    },
    alvara: {
      situacao: "sem_alvara",
    },
    nfseConstrucao12m: 8_500,
    valorEstimadoObra: 520_000,
    severidade: 4,
    status: "novo",
  },
  {
    id: "og-009",
    contribuinteId: "ct-005",
    endereco: "Rua Fictícia Dom Joaquim, 310",
    bairro: "Dom Joaquim",
    tipo: "obra_nova",
    x: 40,
    y: 20,
    deteccao: {
      fonte: "street_view",
      detectadoEm: "2026-06-05",
      confianca: 0.82,
      resumo:
        "Nova sede em construção (2 pavimentos); alvará emitido para pavimento único — indício de acréscimo não licenciado.",
      areaDetectadaM2: 360,
    },
    alvara: {
      situacao: "alvara_divergente",
      numero: "ALV-2025-1044",
      areaLicenciadaM2: 200,
    },
    nfseConstrucao12m: 45_000,
    valorEstimadoObra: 280_000,
    severidade: 3,
    status: "novo",
  },
  {
    id: "og-010",
    contribuinteId: "ct-020",
    endereco: "Rua Fictícia das Hortênsias, 88",
    bairro: "Santa Terezinha",
    tipo: "ampliacao",
    x: 35,
    y: 45,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-12",
      confianca: 0.78,
      resumo:
        "Mezanino e depósito novos dentro do polígono licenciado; NFS-e de construção declaradas cobrem fração pequena do serviço estimado.",
      areaDetectadaM2: 240,
    },
    alvara: {
      situacao: "alvara_compativel",
      numero: "ALV-2026-0355",
      areaLicenciadaM2: 260,
    },
    nfseConstrucao12m: 30_000,
    valorEstimadoObra: 150_000,
    severidade: 2,
    status: "novo",
  },
  {
    id: "og-011",
    contribuinteId: "ct-018",
    endereco: "Rua Fictícia Primeiro de Maio, 1205",
    bairro: "Primeiro de Maio",
    tipo: "obra_nova",
    x: 12,
    y: 32,
    deteccao: {
      fonte: "satelite",
      detectadoEm: "2026-06-29",
      confianca: 0.96,
      resumo:
        "Galpão logístico novo (~1.100 m²) com movimentação de veículos de carga; nenhum licenciamento ou NFS-e localizados.",
      areaDetectadaM2: 1100,
    },
    alvara: {
      situacao: "sem_alvara",
    },
    nfseConstrucao12m: 0,
    valorEstimadoObra: 890_000,
    severidade: 5,
    status: "novo",
  },
  {
    id: "og-012",
    contribuinteId: "ct-009",
    endereco: "Rua Fictícia XV de Agosto, 45",
    bairro: "Centro",
    tipo: "reforma",
    x: 55,
    y: 51,
    deteccao: {
      fonte: "street_view",
      detectadoEm: "2026-06-15",
      confianca: 0.8,
      resumo:
        "Retrofit de imóvel comercial com troca estrutural de esquadrias e cobertura; alvará cobre apenas pintura e revisão elétrica.",
      areaDetectadaM2: 300,
    },
    alvara: {
      situacao: "alvara_divergente",
      numero: "ALV-2026-0188",
      areaLicenciadaM2: 120,
    },
    nfseConstrucao12m: 26_000,
    valorEstimadoObra: 190_000,
    severidade: 3,
    status: "novo",
  },
];
