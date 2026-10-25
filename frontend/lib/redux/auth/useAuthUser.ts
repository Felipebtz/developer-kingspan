"use client";

import { useSelector } from "react-redux";
import type { AuthState } from "./authSlice";

type UserRole = "SOLICITANTE" | "APROVADOR" | "ADMIN";

export function useAuthUser() {
  const user = useSelector(
    (state: { auth: AuthState }) => state.auth.user
  );

  const profile = user as
    | (typeof user & {
        name?: string;
        fullName?: string;
        email?: string;
        role?: UserRole;
      })
    | null;

  const name =
    profile?.name ??
    profile?.fullName ??
    "Usuário";

  const email = profile?.email ?? "";

  const role = profile?.role ?? null;

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return {
    user,
    name,
    email,
    role,
    initials,
  };
}