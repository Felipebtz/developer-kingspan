
"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  requestsApi,
  type RequestRow,
} from "@/lib/api/requests"

import type { AuthState } from "@/lib/redux/auth/authSlice";

export function useRequests() {
  const token = useSelector(
    (state: { auth: AuthState }) => state.auth.accessToken
  );

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!token) {
      setRequests([]);
      setLoading(false);
      setError("Sessão não encontrada.");
      return;
    }

    setLoading(true);
    setError(null);

    requestsApi
      .list()
      .then((data) => {
        if (active) setRequests(data);
      })
      .catch((err: unknown) => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao buscar solicitações."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return { requests, loading, error };
}
