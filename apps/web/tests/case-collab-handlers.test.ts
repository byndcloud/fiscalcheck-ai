import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type {
  CaseAnnotation,
  Caso,
  CitizenInteracao,
  Notificacao,
} from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T14 — contrato dos handlers de colaboração no caso (módulo 4):
  - anotações do auditor: append-only, com autoria, validação e RBAC;
  - devolutivas eletrônicas: pré-triagem do agente presente, tratamento
    Acatar/Manter/Solicitar complemento com justificativa, idempotente;
  - devolutiva nova notifica o auditor no sino com deep-link ao caso.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const AUDITOR_HEADERS = {
  "Content-Type": "application/json",
  "X-Actor-Role": "auditor",
  "X-Actor-Id": "aud-0007",
  "X-Actor-Name": "Helena Prates",
};

async function getCasos(): Promise<Caso[]> {
  const res = await fetch(`${API_URL}/cases`);
  expect(res.ok).toBe(true);
  return (await res.json()) as Caso[];
}

async function getInteracoes(casoId: string): Promise<CitizenInteracao[]> {
  const res = await fetch(`${API_URL}/cases/${casoId}/interacoes`);
  expect(res.ok).toBe(true);
  return (await res.json()) as CitizenInteracao[];
}

/** Localiza o caso que recebeu a devolutiva seed (contestação pendente). */
async function findSeededCase(): Promise<{ casoId: string; contestacao: CitizenInteracao }> {
  const casos = await getCasos();
  for (const caso of casos) {
    const interacoes = await getInteracoes(caso.id);
    const contestacao = interacoes.find((i) => i.id === "ci-seed-0001");
    if (contestacao) return { casoId: caso.id, contestacao };
  }
  throw new Error("Seed de devolutiva não encontrado.");
}

describe("Anotações do auditor — handlers (T14)", () => {
  it("registra anotação com autoria e devolve a lista mais recente primeiro", async () => {
    const { casoId } = await findSeededCase();

    const res = await fetch(`${API_URL}/cases/${casoId}/annotations`, {
      method: "POST",
      headers: AUDITOR_HEADERS,
      body: JSON.stringify({ texto: "Solicitei os livros fiscais da competência 05/2026." }),
    });
    expect(res.status).toBe(201);
    const criada = (await res.json()) as CaseAnnotation;
    expect(criada.autorNome).toBe("Helena Prates");
    expect(criada.autorPapel).toBe("auditor");

    const listRes = await fetch(`${API_URL}/cases/${casoId}/annotations`);
    const notas = (await listRes.json()) as CaseAnnotation[];
    expect(notas.length).toBeGreaterThanOrEqual(3); // 2 do seed + a nova
    expect(notas[0]?.id).toBe(criada.id);
    for (let i = 1; i < notas.length; i += 1) {
      expect(
        (notas[i - 1] as CaseAnnotation).criadoEm >= (notas[i] as CaseAnnotation).criadoEm,
      ).toBe(true);
    }
  });

  it("rejeita anotação curta (400) e cidadão (403)", async () => {
    const { casoId } = await findSeededCase();

    const curta = await fetch(`${API_URL}/cases/${casoId}/annotations`, {
      method: "POST",
      headers: AUDITOR_HEADERS,
      body: JSON.stringify({ texto: "ok" }),
    });
    expect(curta.status).toBe(400);

    const cidadao = await fetch(`${API_URL}/cases/${casoId}/annotations`, {
      method: "POST",
      headers: { ...AUDITOR_HEADERS, "X-Actor-Role": "cidadao" },
      body: JSON.stringify({ texto: "Tentativa indevida de anotação." }),
    });
    expect(cidadao.status).toBe(403);
  });
});

describe("Devolutivas eletrônicas — handlers (T14)", () => {
  it("devolutiva seed chega com pré-triagem do agente (não vinculante)", async () => {
    const { contestacao } = await findSeededCase();
    expect(contestacao.tipo).toBe("contestacao");
    expect(contestacao.preTriagem).toBeDefined();
    expect(contestacao.preTriagem?.recomendacao).toBe("solicitar_complemento");
    expect(contestacao.preTriagem?.confianca).toBeGreaterThan(0);
    expect(contestacao.tratamento).toBeUndefined();
  });

  it("tratamento registra autoria + justificativa e é idempotente (409 na segunda)", async () => {
    const { casoId, contestacao } = await findSeededCase();

    const res = await fetch(`${API_URL}/cases/${casoId}/interacoes/${contestacao.id}/tratamento`, {
      method: "POST",
      headers: AUDITOR_HEADERS,
      body: JSON.stringify({
        acao: "solicitar_complemento",
        justificativa: "Anexos não incluem as NFS-e alegadas — solicitar os documentos fiscais.",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { interacao: CitizenInteracao; caso: Caso };
    expect(body.interacao.tratamento?.acao).toBe("solicitar_complemento");
    expect(body.interacao.tratamento?.tratadoPorNome).toBe("Helena Prates");
    expect(body.caso.observacoes).toContain(contestacao.protocolo);

    const again = await fetch(
      `${API_URL}/cases/${casoId}/interacoes/${contestacao.id}/tratamento`,
      {
        method: "POST",
        headers: AUDITOR_HEADERS,
        body: JSON.stringify({ acao: "manter", justificativa: "Segunda tentativa indevida." }),
      },
    );
    expect(again.status).toBe(409);
  });

  it("justificativa curta é rejeitada (400)", async () => {
    const { casoId } = await findSeededCase();
    const res = await fetch(`${API_URL}/cases/${casoId}/interacoes/ci-seed-0002/tratamento`, {
      method: "POST",
      headers: AUDITOR_HEADERS,
      body: JSON.stringify({ acao: "acatar", justificativa: "ok" }),
    });
    expect(res.status).toBe(400);
  });

  it("devolutiva nova (contestação do cidadão) muda o caso e notifica o sino com deep-link", async () => {
    const citizenRes = await fetch(`${API_URL}/citizen/cases`);
    const meus = (await citizenRes.json()) as Caso[];
    const alvo = meus[0] as Caso;
    expect(alvo).toBeDefined();

    const res = await fetch(`${API_URL}/citizen/cases/${alvo.id}/contestacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assunto: "Divergência de competência",
        mensagem:
          "As notas apontadas pertencem à competência anterior e já foram declaradas no PGDAS-D.",
        arquivos: [],
      }),
    });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { interacao: CitizenInteracao; caso: Caso };

    // Pré-triagem gerada na chegada (T14).
    expect(body.interacao.preTriagem).toBeDefined();
    // Devolutiva refletida no caso (aceite: muda o estado do caso).
    expect(body.caso.observacoes).toContain(body.interacao.protocolo);

    // Sino do auditor: notificação tipo devolutiva com deep-link ao dossiê.
    const notifRes = await fetch(`${API_URL}/notifications`);
    const notificacoes = (await notifRes.json()) as Notificacao[];
    const devolutiva = notificacoes.find(
      (n) => n.tipo === "devolutiva" && n.casoId === alvo.id && !n.lida,
    );
    expect(devolutiva).toBeDefined();
    expect(devolutiva?.linkHref).toBe(`/cases?caso=${alvo.id}`);
  });
});
