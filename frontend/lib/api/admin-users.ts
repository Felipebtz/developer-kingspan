import { apiRequest } from "@/lib/api/http";

export type AdminUserRole = "SOLICITANTE" | "APROVADOR" | "ADMIN";
export type AdminUserStatus = "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE";
export type ApproverLevel = "NIVEL_1" | "NIVEL_2";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  approverLevel: ApproverLevel | null;
  costCenterId: number | null;
}

export interface AdminUsersPage {
  data: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ActivateUserPayload {
  role: "SOLICITANTE" | "APROVADOR";
  costCenterId: number;
  approverLevel: ApproverLevel | null;
}

export const adminUsersApi = {
  list(page = 0, size = 20, status?: AdminUserStatus): Promise<AdminUsersPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiRequest<AdminUsersPage>(`/admin/users?${params.toString()}`);
  },

  activate(id: number, payload: ActivateUserPayload): Promise<AdminUser> {
    return apiRequest<AdminUser>(`/admin/users/${id}/activate`, {
      method: "PATCH",
      json: payload,
    });
  },
};
