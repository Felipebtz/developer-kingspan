
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import { Plus, RefreshCw } from "lucide-react";

import {
  administrationApi,
  type CostCenter,
} from "@/lib/api/administration";

import type { AuthState } from "@/lib/redux/auth/authSlice";

export default function CostCentersPage() {
  const auth = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const isAdmin = auth.user?.role === "ADMIN";

  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setCenters([]);
      return;
    }

    let active = true;

    administrationApi
      .listCostCenters()
      .then((data) => {
        if (active) setCenters(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao consultar centros de custo."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, reload]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const created = await administrationApi.createCostCenter({
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
      });

      setCenters((current) => [...current, created]);
      setCode("");
      setName("");
      setDescription("");
      setMessage("Centro de custo cadastrado com sucesso.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o centro de custo."
      );
    } finally {
      setSaving(false);
    }
  }

  if (auth.status === "pending" && !auth.user) {
    return <p className="p-6 text-slate-500">Validando sessão...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-md border bg-white p-6">
        <h1 className="text-xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-600">
          Apenas administradores podem gerenciar centros de custo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          onClick={() => {
            setLoading(true);
            setError("");
            setReload((value) => value + 1);
          }}
          className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm"
        >
          <RefreshCw className="size-4" />
          Atualizar
        </button>
      </div>

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
            <label htmlFor="cc-code" className="mb-2 block text-sm">
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
            <label htmlFor="cc-name" className="mb-2 block text-sm">
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
            <label htmlFor="cc-description" className="mb-2 block text-sm">
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
            disabled={saving}
            className="rounded bg-[#004289] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Cadastrar centro de custo"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}

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
              {!loading &&
                centers.map((center) => (
                  <tr key={center.id} className="border-b">
                    <td className="px-5 py-4 font-medium">
                      {center.code}
                    </td>
                    <td className="px-5 py-4">{center.name}</td>
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

              {loading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading && !error && centers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
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
