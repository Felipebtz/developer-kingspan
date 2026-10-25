
import { apiRequest } from "@/lib/api/http";

export interface CostCenter {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface MonthlyBudget {
  id: number;
  costCenterId: number;
  costCenterName: string;
  competence: string;
  allocatedAmount: number;
  consumedAmount: number;
  availableAmount: number;
}

export interface CreateCostCenterDTO {
  code: string;
  name: string;
  description: string;
}

export interface CreateMonthlyBudgetDTO {
  costCenterId: number;
  competence: string;
  allocatedAmount: number;
}

export interface UpdateMonthlyBudgetDTO {
  allocatedAmount: number;
}

export const administrationApi = {
  listCostCenters(): Promise<CostCenter[]> {
    return apiRequest<CostCenter[]>("/admin/cost-centers");
  },

  createCostCenter(
    payload: CreateCostCenterDTO
  ): Promise<CostCenter> {
    return apiRequest<CostCenter>("/admin/cost-centers", {
      method: "POST",
      json: payload,
    });
  },

  listBudgets(): Promise<MonthlyBudget[]> {
    return apiRequest<MonthlyBudget[]>("/admin/budgets");
  },

  createBudget(
    payload: CreateMonthlyBudgetDTO
  ): Promise<MonthlyBudget> {
    return apiRequest<MonthlyBudget>("/admin/budgets", {
      method: "POST",
      json: payload,
    });
  },

  updateBudget(
    id: number,
    payload: UpdateMonthlyBudgetDTO
  ): Promise<MonthlyBudget> {
    return apiRequest<MonthlyBudget>(
      `/admin/budgets/${id}`,
      {
        method: "PUT",
        json: payload,
      }
    );
  },
};
