import { describe, expect, it } from "vitest";

import { AUDITOR_ROLES, homeRouteForRole, isAuditorRole } from "@/lib/roles";

describe("homeRouteForRole", () => {
  it("envia auditor para /dashboard", () => {
    expect(homeRouteForRole("auditor")).toBe("/dashboard");
  });

  it("envia supervisor e admin para /dashboard", () => {
    expect(homeRouteForRole("supervisor")).toBe("/dashboard");
    expect(homeRouteForRole("admin")).toBe("/dashboard");
  });

  it("envia cidadão para /citizen", () => {
    expect(homeRouteForRole("cidadao")).toBe("/citizen");
  });
});

describe("isAuditorRole", () => {
  it("é verdadeiro para papéis internos da SEFAZ", () => {
    for (const role of AUDITOR_ROLES) {
      expect(isAuditorRole(role)).toBe(true);
    }
  });

  it("é falso para cidadão e agente do sistema", () => {
    expect(isAuditorRole("cidadao")).toBe(false);
    expect(isAuditorRole("agente_sistema")).toBe(false);
  });

  it("é falso para null/undefined", () => {
    expect(isAuditorRole(null)).toBe(false);
    expect(isAuditorRole(undefined)).toBe(false);
  });
});
