export interface ApiAuthBridge {
  getToken: () => string | null | undefined;
  onUnauthorized?: () => void;
}

let authBridge: ApiAuthBridge = {
  getToken: () => null,
};

export function configureApiAuth(
  bridge: ApiAuthBridge
): void {
  authBridge = bridge;
}

export type ApiFieldError =
  | Record<string, unknown>
  | string;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly detail: string,
    public readonly errors: ApiFieldError[] = [],
    public readonly requestId?: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = RequestInit & {
  json?: unknown;
  unauthenticated?: boolean;
  ignoreUnauthorized?: boolean;
};

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parsePayload(raw: string): unknown {
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8085"
  ).replace(/\/+$/, "");
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(
      "O caminho da API deve começar com / e não pode ser URL externa."
    );
  }

  const {
    json,
    unauthenticated = false,
    ignoreUnauthorized = false,
    ...requestInit
  } = options;

  if (
    json !== undefined &&
    requestInit.body !== undefined
  ) {
    throw new Error(
      "Forneça json OU body, nunca os dois."
    );
  }

  const headers = new Headers(requestInit.headers);

  headers.set(
    "Accept",
    "application/json, application/problem+json"
  );

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (!unauthenticated) {
    const token = authBridge.getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...requestInit,
      headers,
      body:
        json === undefined
          ? requestInit.body
          : JSON.stringify(json),
      cache: requestInit.cache ?? "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Confira sua conexão."
    );
  }

  const raw = await response.text();
  const payload = parsePayload(raw);

  if (!response.ok) {
    const data = asObject(payload);

    const errors = Array.isArray(data.errors)
      ? (data.errors as ApiFieldError[])
      : [];

    const detail =
      asString(data.detail) ??
      asString(data.message) ??
      (typeof payload === "string" && payload.trim()
        ? payload
        : `Erro HTTP ${response.status}`);

    const error = new ApiError(
      response.status,
      asString(data.code) ?? `HTTP_${response.status}`,
      detail,
      errors,
      asString(data.requestId) ??
        response.headers.get("X-Request-Id") ??
        undefined
    );

    if (
      response.status === 401 &&
      !unauthenticated &&
      !ignoreUnauthorized
    ) {
      authBridge.onUnauthorized?.();
    }

    throw error;
  }

  return payload as T;
}