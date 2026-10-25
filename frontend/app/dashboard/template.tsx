"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SESSION_TOKEN_KEY } from "@/lib/redux/auth/session";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085"}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Falha ao validar a sessão");
        }

        if (active) setAuthorized(true);
      } catch {
        if (active) setError(true);
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <main className="p-8">
        Não foi possível validar sua sessão.
        Verifique a conexão com o backend e atualize a página.
      </main>
    );
  }

  if (!authorized) {
    return <main className="p-8">Verificando sessão...</main>;
  }

  return <>{children}</>;
}