/**
 * Cliente HTTP do FiscalCheck AI.
 *
 * - Centraliza base URL e headers.
 * - Adiciona `X-Correlation-Id` por requisição para casar com o
 *   logging estruturado do backend (cadeia de custódia auditável).
 * - Trata erros para nunca expor stack traces no UI do auditor.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly correlationId: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const correlationId = generateCorrelationId();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Correlation-Id", correlationId);

  let body: BodyInit | null = null;
  if (options.body !== undefined && options.body !== null) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `Falha na requisição (${response.status}).`;
    try {
      const data = (await response.json()) as {
        error_code?: string;
        detail?: string;
      };
      code = data.error_code ?? code;
      message = data.detail ?? message;
    } catch {
      // resposta sem JSON
    }
    throw new ApiError(response.status, code, message, correlationId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
