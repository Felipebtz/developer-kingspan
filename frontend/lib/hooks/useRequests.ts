"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  requestsApi,
  type RequestRow,
} from "@/lib/api/requests";

import type { AuthState } from "@/lib/redux/auth/authSlice";

type RequestsSnapshot = {
  key: string;
  requests: RequestRow[];
  error: string | null;
};

export function useRequests() {
  const token = useSelector(
    (state: { auth: AuthState }) => state.auth.accessToken
  );

  const [refreshCount, setRefreshCount] = useState(0);
  const [snapshot, setSnapshot] =
    useState<RequestsSnapshot | null>(null);

  const key = token ? `${token}:${refreshCount}` : null;

  useEffect(() => {
    if (!key) return;

    let active = true;

    requestsApi
      .list()
      .then((data) => {
        if (active) {
          setSnapshot({
            key,
            requests: data,
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (!active) return;

        setSnapshot({
          key,
          requests: [],
          error:
            err instanceof Error
              ? err.message
              : "Erro ao buscar solicitações.",
        });
      });

    return () => {
      active = false;
    };
  }, [key]);

  const current = snapshot?.key === key ? snapshot : null;

  return {
    requests: current?.requests ?? [],
    loading: Boolean(key) && !current,
    error: !token
      ? "Sessão não encontrada."
      : current?.error ?? null,
    refresh: () => setRefreshCount((value) => value + 1),
  };
}