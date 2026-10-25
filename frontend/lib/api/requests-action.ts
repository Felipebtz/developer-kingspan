import { apiRequest } from "./http";
import type { RequestStatus } from "./requests";

export type RequestCategory =
  | "EQUIPMENT"
  | "SERVICES"
  | "SUPPLIES"
  | "TRAVEL"
  | "SOFTWARE"
  | "OTHER";

export const requestCategories: { value: RequestCategory; label: string }[] = [
  { value: "EQUIPMENT", label: "Equipamentos" },
  { value: "SERVICES", label: "Serviços" },
  { value: "SUPPLIES", label: "Materiais" },
  { value: "TRAVEL", label: "Viagens" },
  { value: "SOFTWARE", label: "Software" },
  { value: "OTHER", label: "Outros" },
];

export const requestStatusDisplay: Record<
  RequestStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: "Rascunho", color: "text-slate-800" },
  PENDING_APPROVAL: { label: "Em aprovação", color: "text-amber-700" },
  CHANGES_REQUESTED: { label: "Alterações solicitadas", color: "text-purple-700" },
  APPROVED: { label: "Aprovada", color: "text-[#004289]" },
  REJECTED: { label: "Rejeitada", color: "text-red-600" },
  CANCELLED: { label: "Cancelada", color: "text-slate-500" },
};

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export interface RequestItemDTO {
  id?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface RequestDetailsDTO {
  id: number;
  requesterId: number;
  costCenterId: number;
  title: string | null;
  description: string | null;
  category: RequestCategory | null;
  neededBy: string | null;
  totalAmount: number;
  status: RequestStatus;
  currentVersion: number;
  lockVersion: number;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string | null;
  items: RequestItemDTO[];
  allowedActions?: string[] | Record<string, boolean>;
  approvalSteps?: {
    id?: number;
    stepOrder?: number;
    requiredLevel?: string;
    status?: string;
    decidedAt?: string | null;
  }[];
  auditEvents?: {
    id?: number;
    action?: string;
    createdAt?: string;
    comments?: string | null;
    userRole?: string;
  }[];
}

export interface CreatePurchaseRequestDTO {
  title: string;
  description: string;
  category: RequestCategory | null;
  neededBy: string | null;
  items: RequestItemDTO[];
  // Incluir somente quando o DTO Java exigir e a sessão expuser o ID.
  costCenterId?: number;
}

export interface UpdatePurchaseRequestDTO extends CreatePurchaseRequestDTO {
  lockVersion: number;
}

function pathFor(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador da solicitação inválido.");
  }
  return `/requests/${id}`;
}

export const requestActionsApi = {
  byId(id: number): Promise<RequestDetailsDTO> {
    return apiRequest<RequestDetailsDTO>(pathFor(id), { method: "GET" });
  },

  create(dto: CreatePurchaseRequestDTO, key: string): Promise<RequestDetailsDTO> {
    return apiRequest<RequestDetailsDTO>("/requests", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      json: dto,
    });
  },

  update(id: number, dto: UpdatePurchaseRequestDTO): Promise<RequestDetailsDTO | void> {
    return apiRequest<RequestDetailsDTO | void>(pathFor(id), {
      method: "PUT",
      json: dto,
    });
  },

  submit(id: number, lockVersion: number): Promise<unknown> {
    return apiRequest<unknown>(`${pathFor(id)}/submit`, {
      method: "POST",
      json: { lockVersion },
    });
  },
};

export function formatDate(value?: string | null): string {
  if (!value) return "Não informada";
  // Evita mudar um LocalDate para o dia anterior por causa do timezone.
  const day = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const [year, month, date] = day.split("-");
    return `${date}/${month}/${year}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
}

export function canEditRequest(
  request: RequestDetailsDTO,
  userId?: number,
): boolean {
  return (
    userId === request.requesterId &&
    (request.status === "DRAFT" || request.status === "CHANGES_REQUESTED")
  );
}
