"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Check, Search, RefreshCw } from "lucide-react";
import { administrationApi, type CostCenter } from "@/lib/api/administration";
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

export default function UsersPage() {
  const auth = useSelector((state: { auth: AuthState }) => state.auth);
  const isAdmin = auth.user?.role === "ADMIN";
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<ActivateUserPayload["role"]>("SOLICITANTE");
  const [level, setLevel] = useState<ApproverLevel>("NIVEL_1");
  const [centerId, setCenterId] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      adminUsersApi.list(page, 20, statusFilter === "ALL" ? undefined : statusFilter),
      administrationApi.listCostCenters(),
    ])
      .then(([response, costCenters]) => {
        if (!active) return;
        if (!Array.isArray(response.data)) {
          throw new Error("O endpoint /admin/users não retornou o campo data esperado.");
        }
        setUsers(response.data);
        setTotalPages(Math.max(1, response.totalPages || 1));
        setTotalElements(response.totalElements || 0);
        setCenters(costCenters);
      })
      .catch((e: unknown) => {
        if (active) {
          setUsers([]);
          setError(e instanceof Error ? e.message : "Erro ao buscar usuários.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isAdmin, page, statusFilter, reload, auth.accessToken]);

  function openActivation(user: AdminUser) {
    if (user.role === "ADMIN" || user.status === "ACTIVE") return;
    setSelected(user);
    setRole(user.role === "APROVADOR" ? "APROVADOR" : "SOLICITANTE");
    setLevel(user.approverLevel ?? "NIVEL_1");
    setCenterId(String(user.costCenterId ?? centers.find((c) => c.status === "ACTIVE")?.id ?? ""));
    setError("");
    setMessage("");
  }

  async function activate() {
    if (!selected || saving) return;
    const parsedId = Number(centerId);
    if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
      setError("Selecione um centro de custo válido.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await adminUsersApi.activate(selected.id, {
        role,
        costCenterId: parsedId,
        approverLevel: role === "APROVADOR" ? level : null,
      });
      setMessage(`Usuário ${selected.name} ativado com sucesso.`);
      setSelected(null);
      setReload((v) => v + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Não foi possível ativar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  const displayed = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const centerNames = new Map(centers.map((c) => [c.id, c.name]));

  if (!isAdmin) {
    return <div className="rounded border bg-white p-6 text-sm text-slate-700">Acesso restrito ao administrador.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de usuários</h1>
          <p className="mt-1 text-sm text-slate-500">Usuários cadastrados no sistema.</p>
        </div>
        <button type="button" onClick={() => setReload((v) => v + 1)} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm">
          <RefreshCw className="size-4" /> Atualizar
        </button>
      </div>
      {message && <p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Usuários cadastrados</h2>
            <p className="mt-1 text-xs text-slate-500">{totalElements} usuário(s) no sistema</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select aria-label="Filtrar por status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as AdminUserStatus | "ALL"); setPage(0); }} className="h-10 rounded border border-slate-300 bg-white px-3 text-sm">
              <option value="ALL">Todos os status</option>
              <option value="PENDING_APPROVAL">Pendentes</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nesta página" className="h-10 rounded border border-slate-300 pl-9 pr-3 text-sm" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#004289] text-white"><tr>
              { ["Nome", "E-mail", "Perfil", "Nível", "Centro de custo", "Status", "Ações"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>) }
            </tr></thead>
            <tbody>
              {!loading && displayed.map((user, i) => (
                <tr key={user.id} className={`border-b border-slate-200 ${i % 2 ? "bg-[#F5F7FA]" : "bg-white"}`}>
                  <td className="px-4 py-4 font-medium">{user.name}</td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">{user.approverLevel ?? "—"}</td>
                  <td className="px-4 py-4">{user.costCenterId ? centerNames.get(user.costCenterId) ?? `#${user.costCenterId}` : "—"}</td>
                  <td className="px-4 py-4">{statusLabel[user.status] ?? user.status}</td>
                  <td className="px-4 py-4">
                    {user.role !== "ADMIN" && user.status !== "ACTIVE" ? (
                      <button type="button" onClick={() => openActivation(user)} className="inline-flex items-center gap-1 rounded bg-[#004289] px-3 py-2 text-xs text-white"><Check className="size-3.5" /> Ativar</button>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Carregando usuários...</td></tr>}
              {!loading && displayed.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t p-4 text-sm text-slate-500">
          <span>Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={loading || page === 0} onClick={() => setPage((v) => Math.max(0, v - 1))} className="rounded border px-3 py-2 disabled:opacity-40">Anterior</button>
            <button type="button" disabled={loading || page + 1 >= totalPages} onClick={() => setPage((v) => v + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </section>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="activate-user-title" className="w-full max-w-md rounded bg-white p-6 shadow-xl">
            <h2 id="activate-user-title" className="text-lg font-semibold text-slate-900">Ativar usuário</h2>
            <p className="mt-1 text-sm text-slate-600">{selected.name} — {selected.email}</p>
            <label htmlFor="activate-role" className="mt-5 block text-sm font-medium">Perfil</label>
            <select id="activate-role" value={role} onChange={(e) => setRole(e.target.value as ActivateUserPayload["role"])} className="mt-2 h-10 w-full rounded border px-3 text-sm">
              <option value="SOLICITANTE">Solicitante</option>
              <option value="APROVADOR">Aprovador</option>
            </select>
            {role === "APROVADOR" && <>
              <label htmlFor="activate-level" className="mt-4 block text-sm font-medium">Nível de aprovação</label>
              <select id="activate-level" value={level} onChange={(e) => setLevel(e.target.value as ApproverLevel)} className="mt-2 h-10 w-full rounded border px-3 text-sm">
                <option value="NIVEL_1">Nível 1</option><option value="NIVEL_2">Nível 2</option>
              </select>
            </>}
            <label htmlFor="activate-center" className="mt-4 block text-sm font-medium">Centro de custo</label>
            <select id="activate-center" value={centerId} onChange={(e) => setCenterId(e.target.value)} className="mt-2 h-10 w-full rounded border px-3 text-sm">
              <option value="">Selecione</option>
              {centers.filter((c) => c.status === "ACTIVE").map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setSelected(null)} className="rounded border px-4 py-2 text-sm">Cancelar</button>
              <button type="button" disabled={saving || !centerId} onClick={activate} className="rounded bg-[#004289] px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? "Ativando..." : "Confirmar ativação"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
