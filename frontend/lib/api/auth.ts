import { apiRequest } from "./http";

export type UserRole =
  | "SOLICITANTE"
  | "APROVADOR"
  | "ADMIN";

export type UserStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "INACTIVE";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login(
    credentials: LoginRequestDTO
  ): Promise<LoginResponseDTO> {
    return apiRequest<LoginResponseDTO>("/auth/login", {
      method: "POST",
      json: credentials,
      unauthenticated: true,
    });
  },

  me(): Promise<AuthUser> {
    return apiRequest<AuthUser>("/auth/me", {
      method: "GET",
    });
  },
};