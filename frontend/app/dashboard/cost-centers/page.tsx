
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import { Plus, RefreshCw } from "lucide-react";

import {
  administrationApi,
  type CostCenter,
} from "@/lib/api/administration";

import type { AuthState } from "@/lib/redux/auth/authSlice";

type CentersSnapshot = {
  key: string;
  centers: CostCenter[];
  error: string | null;
};

type Feedback = {
  key: string;
  kind: "success" | "error";
  text: string;
};

export default function CostCentersPage() {
  const auth = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const isAdmin = auth.user?.role === "ADMIN";

  const [snapshot, setSnapshot] =
    useState<CentersSnapshot | null>(null);

  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [feedback, setFeedback] =
    useState<Feedback | null>(null);

  // Identifica a consulta pela sessão e atualização.
  const loadKey =
    isAdmin && auth.accessToken
      ? `${auth.accessToken}:${reload}`
      : null;

  // Evita apresentar dados de uma sessão anterior.
  const current =
    snapshot?.key === loadKey ? snapshot : null;

  const centers = current?.centers ?? [];
  const loading = Boolean(loadKey) && !current;
  const loadError = current?.error ?? null;

  const visibleFeedback =
    feedback?.key === loadKey ? feedback : null;

  useEffect(() => {
    if (!loadKey) return;

    let active = true;

    administrationApi
      .listCostCenters()
      .then((data) => {
        if (!active) return;

        setSnapshot({
          key: loadKey,
          centers: data,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;

        setSnapshot({
          key: loadKey,
          centers: [],
          error:
            err instanceof Error
              ? err.message
              : "Erro ao consultar centros de custo.",
        });
      });

    return () => {
      active = false;
    };
  }, [loadKey]);

  function refresh() {
    setFeedback(null);
    setReload((value) => value + 1);
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || !loadKey) return;

    setSaving(true);
    setFeedback(null);

    try {
      const created =
        await administrationApi.createCostCenter({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
        });

      // Atualiza a listagem somente após confirmação da API.
      setSnapshot((previous) => {
        if (previous?.key !== loadKey) {
          return previous;
        }

        return {
          ...previous,
          centers: [...previous.centers, created],
          error: null,
        };
      });

      setCode("");
      setName("");
      setDescription("");

      setFeedback({
        key: loadKey,
        kind: "success",
        text: "Centro de custo cadastrado com sucesso.",
      });
    } catch (err: unknown) {
      setFeedback({
        key: loadKey,
        kind: "error",
        text:
          err instanceof Error
            ? err.message
            : "Não foi possível cadastrar o centro de custo.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!auth.user && auth.status === "pending") {
    return (
      <p className="p-6 text-slate-500">
        Validando sessão...
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-md border bg-white p-6">
        <h1 className="text-xl font-semibold">
          Acesso restrito
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Apenas administradores podem gerenciar
          centros de custo.
        </p>
      </div>
    );
  }

  if (!auth.accessToken) {
    return (
      <div className="rounded-md border bg-white p-6">
        <p className="text-sm text-slate-600">
          Sessão não encontrada. Faça login novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Centros de custo
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administração dos centros de custo cadastrados.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className="size-4" />
          Atualizar
        </button>
      </div>

      {/* CADASTRO */}
      <form
        onSubmit={handleCreate}
        className="rounded-md border border-slate-200 bg-white p-5"
      >
        <div className="mb-5 flex items-center gap-2">
          <Plus className="size-5 text-[#004289]" />

          <h2 className="font-semibold text-slate-900">
            Novo centro de custo
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="cc-code"
              className="mb-2 block text-sm"
            >
              Código *
            </label>

            <input
              id="cc-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={20}
              required
              placeholder="TI-001"
              className="h-10 w-full rounded border border-slate-300 px-3"
            />
          </div>

          <div>
            <label
              htmlFor="cc-name"
              className="mb-2 block text-sm"
            >
              Nome *
            </label>

            <input
              id="cc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              placeholder="Tecnologia da Informação"
              className="h-10 w-full rounded border border-slate-300 px-3"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="cc-description"
              className="mb-2 block text-sm"
            >
              Descrição
            </label>

            <textarea
              id="cc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-slate-300 p-3"
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded bg-[#004289] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : "Cadastrar centro de custo"}
          </button>
        </div>
      </form>

      {/* ERROS E CONFIRMAÇÕES */}
      {loadError && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {loadError}
        </p>
      )}

      {visibleFeedback && (
        <p
          role={
            visibleFeedback.kind === "error"
              ? "alert"
              : "status"
          }
          className={
            visibleFeedback.kind === "error"
              ? "rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              : "rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          }
        >
          {visibleFeedback.text}
        </p>
      )}

      {/* LISTAGEM */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold text-slate-900">
            Centros cadastrados
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500"
                  >
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading &&
                !loadError &&
                centers.map((center) => (
                  <tr
                    key={center.id}
                    className="border-b"
                  >
                    <td className="px-5 py-4 font-medium">
                      {center.code}
                    </td>

                    <td className="px-5 py-4">
                      {center.name}
                    </td>

                    <td className="px-5 py-4">
                      {center.description || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {center.status === "ACTIVE"
                        ? "Ativo"
                        : "Inativo"}
                    </td>
                  </tr>
                ))}

              {!loading &&
                !loadError &&
                centers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500"
                    >
                      Nenhum centro de custo cadastrado.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
