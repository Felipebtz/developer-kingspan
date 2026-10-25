import { apiRequest } from "@/lib/api/http";

export type ApprovalAction = "APPROVE" | "REJECT" | "REQUEST_CHANGES";

export interface ApprovalRequest {
  id: number;
  title: string;
  category: string | null;
  totalAmount: number;
  createdAt: string | null;
  status: string;
  lockVersion: number;
  allowedActions: string[];
}

export interface RequestsPage {
  data: ApprovalRequest[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Resposta inesperada da API de solicitações.");
  }
  return value as Record<string, unknown>;
}

function normalize(value: unknown): ApprovalRequest {
  const raw = asRecord(value);
  const id = Number(raw.id);
  const amount = Number(raw.totalAmount ?? 0);
  const lockVersion = Number(raw.lockVersion);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A API retornou solicitação sem ID válido.");
  }
  if (!Number.isFinite(amount)) {
    throw new Error(`A solicitação #${id} possui valor inválido.`);
  }
  if (!Number.isSafeInteger(lockVersion) || lockVersion < 0) {
    throw new Error(`A solicitação #${id} não possui lockVersion válido.`);
  }
  return {
    id,
    title: String(raw.title ?? "Sem título"),
    category: typeof raw.category === "string" ? raw.category : null,
    totalAmount: amount,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : null,
    status: String(raw.status ?? ""),
    lockVersion,
    allowedActions: Array.isArray(raw.allowedActions)
      ? raw.allowedActions.filter((x): x is string => typeof x === "string")
      : [],
  };
}

export function isActionAllowed(request: ApprovalRequest, action: ApprovalAction): boolean {
  const actions = request.allowedActions.map((x) => x.toUpperCase().replaceAll("-", "_"));
  return actions.includes(action);
}

export const approvalsApi = {
  async list(page = 0, size = 50): Promise<RequestsPage> {
    const raw = await apiRequest<unknown>(`/requests?page=${page}&size=${size}`, {
      method: "GET",
    });
    const wrapper = Array.isArray(raw) ? { content: raw } : asRecord(raw);
    const items = wrapper.data ?? wrapper.content ?? wrapper.items ?? wrapper.requests;
    if (!Array.isArray(items)) {
      throw new Error("Formato da listagem de solicitações não reconhecido.");
    }
    return {
      data: items.map(normalize),
      page: Number(wrapper.page ?? wrapper.number ?? page),
      size: Number(wrapper.size ?? size),
      totalElements: Number(wrapper.totalElements ?? items.length),
      totalPages: Number(wrapper.totalPages ?? 1),
    };
  },

  async detail(id: number): Promise<ApprovalRequest> {
    return normalize(await apiRequest<unknown>(`/requests/${id}`, { method: "GET" }));
  },

  decide(id: number, action: ApprovalAction, lockVersion: number, comment: string): Promise<void> {
    const route: Record<ApprovalAction, string> = {
      APPROVE: "approve",
      REJECT: "reject",
      REQUEST_CHANGES: "request-changes",
    };
    return apiRequest<void>(`/requests/${id}/${route[action]}`, {
      method: "POST",
      json: { lockVersion, comment },
    });
  },
};
