
import { apiRequest } from "./http";

export type RequestStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface RequestRow {
  id: number;
  title: string;
  category: string;
  date: string;
  amount: number | null;
  status: RequestStatus;
}

export interface ListRequestsOptions {
  mine?: boolean;
}

const statuses: RequestStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

function extractItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    const data = response as Record<string, unknown>;

    for (const key of ["content", "items", "requests", "data"]) {
      if (Array.isArray(data[key])) {
        return data[key] as unknown[];
      }
    }
  }

  throw new Error(
    "A API retornou um formato de listagem não reconhecido."
  );
}

function normalizeRequest(value: unknown): RequestRow {
  if (!value || typeof value !== "object") {
    throw new Error("Solicitação inválida.");
  }

  const data = value as Record<string, unknown>;

  const id = Number(data.id);
  const status = String(data.status);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("ID inválido na resposta da API.");
  }

  if (!statuses.includes(status as RequestStatus)) {
    throw new Error(`Status desconhecido: ${status}`);
  }

  const rawAmount = data.totalAmount ?? data.amount;
  const amount =
    rawAmount === null ||
    rawAmount === undefined ||
    rawAmount === ""
      ? null
      : Number(rawAmount);

  if (amount !== null && !Number.isFinite(amount)) {
    throw new Error(`Valor inválido na solicitação ${id}.`);
  }

  const rawDate =
    data.createdAt ?? data.submittedAt ?? data.date;

  let date = "—";

  if (typeof rawDate === "string" && rawDate.trim()) {
    const parsed = new Date(rawDate);

    date = Number.isNaN(parsed.getTime())
      ? rawDate
      : parsed.toLocaleDateString("pt-BR");
  }

  return {
    id,
    title:
      typeof data.title === "string"
        ? data.title
        : "Sem título",
    category:
      typeof data.category === "string"
        ? data.category
        : "—",
    date,
    amount,
    status: status as RequestStatus,
  };
}

export const requestsApi = {
  async list(options: ListRequestsOptions = {}): Promise<RequestRow[]> {
    const path = options.mine ? "/requests?mine=true" : "/requests";
    const response = await apiRequest<unknown>(path, {
      method: "GET",
    });

    return extractItems(response).map(normalizeRequest);
  },
};
