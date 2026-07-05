import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { CitizenRegistration, UserPreferences, UserProfile } from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T27 — contrato do perfil e preferências do usuário:
  - GET /me devolve identidade distinta por papel (nome, e-mail);
  - o cidadão traz dados cadastrais detalhados; papéis internos, não;
  - PUT /me/preferences persiste na camada fake e o merge é parcial;
  - preferências não vazam entre papéis.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getProfile(role: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/me?role=${role}`);
  expect(res.ok).toBe(true);
  return (await res.json()) as UserProfile;
}

describe("Perfil do usuário — handlers (T27)", () => {
  it("devolve identidade distinta por papel", async () => {
    const auditor = await getProfile("auditor");
    const supervisor = await getProfile("supervisor");
    const admin = await getProfile("admin");
    const cidadao = await getProfile("cidadao");

    const nomes = [auditor.nome, supervisor.nome, admin.nome, cidadao.nome];
    expect(new Set(nomes).size).toBe(4);
    expect(auditor.email).toContain("@brusque.sc.gov.br");
  });

  it("cidadão traz dados cadastrais detalhados; papéis internos, não", async () => {
    const cidadao = await getProfile("cidadao");
    expect(cidadao.dadosCadastrais).toBeDefined();
    expect(cidadao.dadosCadastrais?.cpfMascarado).toMatch(/^\*{3}\./);
    expect(cidadao.dadosCadastrais?.empresasVinculadas.length).toBeGreaterThan(0);
    for (const empresa of cidadao.dadosCadastrais?.empresasVinculadas ?? []) {
      expect(empresa.cnpjMascarado).toContain("*");
    }

    const auditor = await getProfile("auditor");
    expect(auditor.dadosCadastrais).toBeUndefined();
    expect(auditor.matricula).toBeDefined();
  });

  it("rejeita papel inválido com erro amigável", async () => {
    const res = await fetch(`${API_URL}/me?role=hacker`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error_code: string };
    expect(body.error_code).toBe("invalid_role");
  });

  it("persiste preferências com merge parcial e sem vazar entre papéis", async () => {
    const putRes = await fetch(`${API_URL}/me/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "auditor", preferencias: { densidade: "compacta" } }),
    });
    expect(putRes.ok).toBe(true);
    const updated = (await putRes.json()) as UserPreferences;
    expect(updated.densidade).toBe("compacta");
    // Merge parcial: o que não foi enviado permanece no default.
    expect(updated.tamanhoFonte).toBe("padrao");
    expect(updated.notificacoesAtivas).toBe(true);

    const auditor = await getProfile("auditor");
    expect(auditor.preferencias.densidade).toBe("compacta");

    const supervisor = await getProfile("supervisor");
    expect(supervisor.preferencias.densidade).toBe("confortavel");
  });

  it("PUT /me/registration atualiza contato/endereço e preserva CPF e vínculos", async () => {
    const antes = await getProfile("cidadao");
    const res = await fetch(`${API_URL}/me/registration`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone: "(47) 98888-0001", endereco: "Rua Nova, 42 — Centro" }),
    });
    expect(res.ok).toBe(true);
    const updated = (await res.json()) as CitizenRegistration;
    expect(updated.telefone).toBe("(47) 98888-0001");
    expect(updated.endereco).toBe("Rua Nova, 42 — Centro");
    // Somente leitura: CPF e empresas vinculadas não mudam pelo portal.
    expect(updated.cpfMascarado).toBe(antes.dadosCadastrais?.cpfMascarado);
    expect(updated.empresasVinculadas).toEqual(antes.dadosCadastrais?.empresasVinculadas);

    // Persistiu: GET /me devolve os novos dados.
    const depois = await getProfile("cidadao");
    expect(depois.dadosCadastrais?.telefone).toBe("(47) 98888-0001");
    expect(new Date(depois.dadosCadastrais?.atualizadoEm ?? 0).getTime()).toBeGreaterThan(
      new Date(antes.dadosCadastrais?.atualizadoEm ?? 0).getTime(),
    );
  });

  it("PUT /me/registration rejeita corpo vazio ou UF inválida", async () => {
    const vazio = await fetch(`${API_URL}/me/registration`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(vazio.status).toBe(400);

    const ufInvalida = await fetch(`${API_URL}/me/registration`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uf: "Santa Catarina" }),
    });
    expect(ufInvalida.status).toBe(400);
  });

  it("rejeita atualização sem nenhuma preferência", async () => {
    const res = await fetch(`${API_URL}/me/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "auditor", preferencias: {} }),
    });
    expect(res.status).toBe(400);
  });
});
