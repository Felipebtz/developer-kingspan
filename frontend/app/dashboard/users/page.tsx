
"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Check, Search, RefreshCw } from "lucide-react";

import {
  administrationApi,
  type CostCenter,
} from "@/lib/api/administration";

import {
  adminUsersApi,
  type AdminUser,
  type AdminUserStatus,
  type ActivateUserPayload,
  type ApproverLevel,
} from "@/lib/api/admin-users";

import type { AuthState } from "@/lib/redux/auth/authSlice";

const statusLabel: Record<AdminUserStatus, string> = {
  PENDING_APPROVAL: "Pendente",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

type UsersSnapshot = {
  key: string;
  users: AdminUser[];
  centers: CostCenter[];
  totalPages: number;
  totalElements: number;
  error: string | null;
};

export default function UsersPage() {
  const auth = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const isAdmin = auth.user?.role === "ADMIN";

  const [snapshot, setSnapshot] =
    useState<UsersSnapshot | null>(null);

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] =
    useState<AdminUserStatus | "ALL">("ALL");

  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);

  const [saving, setSaving] = useState(false);

  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const [selected, setSelected] =
    useState<AdminUser | null>(null);

  const [role, setRole] =
    useState<ActivateUserPayload["role"]>("SOLICITANTE");

  const [level, setLevel] =
    useState<ApproverLevel>("NIVEL_1");

  const [centerId, setCenterId] = useState("");

  const loadKey =
    isAdmin && auth.accessToken
      ? `${auth.accessToken}:${page}:${statusFilter}:${reload}`
      : null;

  const current =
    snapshot?.key === loadKey ? snapshot : null;

  const users = current?.users ?? [];
  const centers = current?.centers ?? [];

  const totalPages = current?.totalPages ?? 1;
  const totalElements = current?.totalElements ?? 0;

  const loading = Boolean(loadKey) && !current;
  const loadError = current?.error ?? null;

  useEffect(() => {
    if (!loadKey) return;

    let active = true;

    Promise.all([
      adminUsersApi.list(
        page,
        20,
        statusFilter === "ALL"
          ? undefined
          : statusFilter
      ),
      administrationApi.listCostCenters(),
    ])
      .then(([response, costCenters]) => {
        if (!active) return;

        if (!Array.isArray(response.data)) {
          throw new Error(
            "O endpoint /admin/users não retornou o campo data esperado."
          );
        }

        setSnapshot({
          key: loadKey,
          users: response.data,
          centers: costCenters,
          totalPages: Math.max(
            1,
            response.totalPages || 1
          ),
          totalElements: response.totalElements || 0,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;

        setSnapshot({
          key: loadKey,
          users: [],
          centers: [],
          totalPages: 1,
          totalElements: 0,
          error:
            err instanceof Error
              ? err.message
              : "Erro ao buscar usuários.",
        });
      });

    return () => {
      active = false;
    };
  }, [loadKey, page, statusFilter]);

  function refresh() {
    setActionError("");
    setReload((value) => value + 1);
  }

  function openActivation(user: AdminUser) {
    if (
      user.role === "ADMIN" ||
      user.status === "ACTIVE"
    ) {
      return;
    }

    setSelected(user);

    setRole(
      user.role === "APROVADOR"
        ? "APROVADOR"
        : "SOLICITANTE"
    );

    setLevel(user.approverLevel ?? "NIVEL_1");

    setCenterId(
      String(
        user.costCenterId ??
          centers.find(
            (center) => center.status === "ACTIVE"
          )?.id ??
          ""
      )
    );

    setActionError("");
    setMessage("");
  }

  async function activate() {
    if (!selected || saving) return;

    const parsedId = Number(centerId);

    if (
      !Number.isSafeInteger(parsedId) ||
      parsedId <= 0
    ) {
      setActionError(
        "Selecione um centro de custo válido."
      );
      return;
    }

    setSaving(true);
    setActionError("");
    setMessage("");

    try {
      await adminUsersApi.activate(selected.id, {
        role,
        costCenterId: parsedId,
        approverLevel:
          role === "APROVADOR" ? level : null,
      });

      setMessage(
        `Usuário ${selected.name} ativado com sucesso.`
      );

      setSelected(null);
      setReload((value) => value + 1);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  const displayed = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const centerNames = new Map(
    centers.map((center) => [
      center.id,
      center.name,
    ])
  );

  if (!auth.user && auth.status === "pending") {
    return (
      <p className="p-6 text-slate-500">
        Validando sessão...
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded border bg-white p-6 text-sm text-slate-700">
        Acesso restrito ao administrador.
      </div>
    );
  }

  if (!auth.accessToken) {
    return (
      <p className="rounded border bg-white p-6 text-sm text-slate-600">
        Sessão não encontrada. Faça login novamente.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Gestão de usuários
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Usuários cadastrados no sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className="size-4" />
          Atualizar
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {message}
        </p>
      )}

      {(actionError || loadError) && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError || loadError}
        </p>
      )}

      {/* LISTAGEM */}
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              Usuários cadastrados
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Carregando..."
                : `${totalElements} usuário(s) no sistema`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Filtrar por status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as
                    | AdminUserStatus
                    | "ALL"
                );
                setPage(0);
              }}
              className="h-10 rounded border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">
                Todos os status
              </option>

              <option value="PENDING_APPROVAL">
                Pendentes
              </option>

              <option value="ACTIVE">
                Ativos
              </option>

              <option value="INACTIVE">
                Inativos
              </option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Buscar nesta página"
                className="h-10 rounded border border-slate-300 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                {[
                  "Nome",
                  "E-mail",
                  "Perfil",
                  "Nível",
                  "Centro de custo",
                  "Status",
                  "Ações",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!loading &&
                !loadError &&
                displayed.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-slate-200 ${
                      index % 2
                        ? "bg-[#F5F7FA]"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-4 font-medium">
                      {user.name}
                    </td>

                    <td className="px-4 py-4">
                      {user.email}
                    </td>

                    <td className="px-4 py-4">
                      {user.role}
                    </td>

                    <td className="px-4 py-4">
                      {user.approverLevel ?? "—"}
                    </td>

                    <td className="px-4 py-4">
                      {user.costCenterId
                        ? centerNames.get(
                            user.costCenterId
                          ) ??
                          `#${user.costCenterId}`
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                      {statusLabel[user.status] ??
                        user.status}
                    </td>

                    <td className="px-4 py-4">
                      {user.role !== "ADMIN" &&
                      user.status !== "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() =>
                            openActivation(user)
                          }
                          className="inline-flex items-center gap-1 rounded bg-[#004289] px-3 py-2 text-xs text-white"
                        >
                          <Check className="size-3.5" />
                          Ativar
                        </button>
                      ) : (
                        <span className="text-slate-400">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500"
                  >
                    Carregando usuários...
                  </td>
                </tr>
              )}

              {!loading &&
                !loadError &&
                displayed.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-500"
                    >
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex items-center justify-between border-t p-4 text-sm text-slate-500">
          <span>
            Página {page + 1} de {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page === 0}
              onClick={() =>
                setPage((value) =>
                  Math.max(0, value - 1)
                )
              }
              className="rounded border px-3 py-2 disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={
                loading || page + 1 >= totalPages
              }
              onClick={() =>
                setPage((value) => value + 1)
              }
              className="rounded border px-3 py-2 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>

      {/* MODAL DE ATIVAÇÃO */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activate-user-title"
            className="w-full max-w-md rounded bg-white p-6 shadow-xl"
          >
            <h2
              id="activate-user-title"
              className="text-lg font-semibold text-slate-900"
            >
              Ativar usuário
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {selected.name} — {selected.email}
            </p>

            <label
              htmlFor="activate-role"
              className="mt-5 block text-sm font-medium"
            >
              Perfil
            </label>

            <select
              id="activate-role"
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as
                    ActivateUserPayload["role"]
                )
              }
              className="mt-2 h-10 w-full rounded border px-3 text-sm"
            >
              <option value="SOLICITANTE">
                Solicitante
              </option>

              <option value="APROVADOR">
                Aprovador
              </option>
            </select>

            {role === "APROVADOR" && (
              <>
                <label
                  htmlFor="activate-level"
                  className="mt-4 block text-sm font-medium"
                >
                  Nível de aprovação
                </label>

                <select
                  id="activate-level"
                  value={level}
                  onChange={(e) =>
                    setLevel(
                      e.target.value as ApproverLevel
                    )
                  }
                  className="mt-2 h-10 w-full rounded border px-3 text-sm"
                >
                  <option value="NIVEL_1">
                    Nível 1
                  </option>

                  <option value="NIVEL_2">
                    Nível 2
                  </option>
                </select>
              </>
            )}

            <label
              htmlFor="activate-center"
              className="mt-4 block text-sm font-medium"
            >
              Centro de custo
            </label>

            <select
              id="activate-center"
              value={centerId}
              onChange={(e) =>
                setCenterId(e.target.value)
              }
              className="mt-2 h-10 w-full rounded border px-3 text-sm"
            >
              <option value="">Selecione</option>

              {centers
                .filter(
                  (center) =>
                    center.status === "ACTIVE"
                )
                .map((center) => (
                  <option
                    key={center.id}
                    value={center.id}
                  >
                    {center.code} — {center.name}
                  </option>
                ))}
            </select>

            {actionError && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600"
              >
                {actionError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setSelected(null);
                  setActionError("");
                }}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={saving || !centerId}
                onClick={() => void activate()}
                className="rounded bg-[#004289] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving
                  ? "Ativando..."
                  : "Confirmar ativação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
