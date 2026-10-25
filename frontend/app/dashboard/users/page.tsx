
"use client";

import { useState } from "react";
import { Search, Check, ArrowUp, ArrowDown } from "lucide-react";

type Role = "SOLICITANTE" | "APROVADOR" | "ADMIN";
type Status = "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE";
type Level = "NIVEL_1" | "NIVEL_2" | null;

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  approverLevel: Level;
  costCenterId: number | null;
};

const initialUsers: User[] = [
  { id: 1, name: "Administrador", email: "admin@exemplo.com", role: "ADMIN", status: "ACTIVE", approverLevel: null, costCenterId: null },
  { id: 2, name: "Carlos Oliveira", email: "carlos@exemplo.com", role: "SOLICITANTE", status: "PENDING_APPROVAL", approverLevel: null, costCenterId: 1 },
  { id: 3, name: "Mariana Souza", email: "mariana@exemplo.com", role: "APROVADOR", status: "ACTIVE", approverLevel: "NIVEL_1", costCenterId: 1 },
  { id: 4, name: "João Pereira", email: "joao@exemplo.com", role: "SOLICITANTE", status: "ACTIVE", approverLevel: null, costCenterId: 2 },
  { id: 5, name: "Ana Costa", email: "ana@exemplo.com", role: "SOLICITANTE", status: "INACTIVE", approverLevel: null, costCenterId: 1 },
];

const centers = [
  { id: 1, name: "Administrativo" },
  { id: 2, name: "Tecnologia" },
  { id: 3, name: "Produção" },
];

const statusLabels: Record<Status, string> = {
  PENDING_APPROVAL: "Pendente",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

const statusColors: Record<Status, string> = {
  PENDING_APPROVAL: "text-[#A16207]",
  ACTIVE: "text-[#004289]",
  INACTIVE: "text-[#DC2626]",
};

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [level, setLevel] = useState<"NIVEL_1" | "NIVEL_2">("NIVEL_1");
  const [center, setCenter] = useState("1");
  const [message, setMessage] = useState("");

  const filtered = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function activate(user: User) {
    if (user.role === "ADMIN" || user.status === "ACTIVE") return;

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? { ...item, status: "ACTIVE" } : item
      )
    );
    setMessage(`Ativação demonstrativa: ${user.name}.`);
  }

  function demote(user: User) {
    if (user.role !== "APROVADOR") return;

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, role: "SOLICITANTE", approverLevel: null }
          : item
      )
    );
    setMessage(`Rebaixamento demonstrativo: ${user.name}.`);
  }

  function promote() {
    if (!selected || selected.role !== "SOLICITANTE" || !center) return;

    setUsers((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              role: "APROVADOR",
              approverLevel: level,
              costCenterId: Number(center),
            }
          : item
      )
    );
    setMessage(`Promoção demonstrativa: ${selected.name}.`);
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Gestão de usuários
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulte usuários e gerencie acessos ao portal.
        </p>
      </div>

      {message && (
        <div role="status" className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#004289]">
          {message} Nenhuma alteração foi enviada ao servidor.
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold">Usuários cadastrados</h2>
          <p className="mt-1 text-xs text-slate-500">Dados demonstrativos</p>

          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, e-mail ou perfil"
              className="h-10 w-full rounded border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#004289]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                {["Nome", "E-mail", "Perfil", "Nível", "Centro de custo", "Status", "Ações"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-200 ${index % 2 ? "bg-[#F5F7FA]" : "bg-white"}`}
                >
                  <td className="px-4 py-4 font-medium">{user.name}</td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">{user.approverLevel ?? "—"}</td>
                  <td className="px-4 py-4">
                    {centers.find((c) => c.id === user.costCenterId)?.name ?? "—"}
                  </td>
                  <td className={`px-4 py-4 font-semibold ${statusColors[user.status]}`}>
                    {statusLabels[user.status]}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.role !== "ADMIN" && user.status !== "ACTIVE" && (
                        <button
                          onClick={() => activate(user)}
                          className="inline-flex items-center gap-1 rounded bg-[#004289] px-3 py-2 text-xs text-white"
                        >
                          <Check className="size-3.5" /> Ativar
                        </button>
                      )}
                      {user.role === "SOLICITANTE" && user.status === "ACTIVE" && (
                        <button
                          onClick={() => {
                            setSelected(user);
                            setLevel("NIVEL_1");
                            setCenter(String(user.costCenterId ?? 1));
                          }}
                          className="inline-flex items-center gap-1 rounded border border-[#004289] px-3 py-2 text-xs text-[#004289]"
                        >
                          <ArrowUp className="size-3.5" /> Promover
                        </button>
                      )}
                      {user.role === "APROVADOR" && (
                        <button
                          onClick={() => demote(user)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-2 text-xs"
                        >
                          <ArrowDown className="size-3.5" /> Rebaixar
                        </button>
                      )}
                      {user.role === "ADMIN" && <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="promote-title" className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h2 id="promote-title" className="text-lg font-semibold">
              Promover para aprovador
            </h2>
            <p className="mt-2 text-sm text-slate-600">{selected.name}</p>

            <label className="mt-5 block text-sm font-medium">Nível de aprovação</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as "NIVEL_1" | "NIVEL_2")}
              className="mt-2 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="NIVEL_1">Nível 1</option>
              <option value="NIVEL_2">Nível 2</option>
            </select>

            <label className="mt-4 block text-sm font-medium">Centro de custo</label>
            <select
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="mt-2 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm"
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="rounded border px-4 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={promote} className="rounded bg-[#004289] px-4 py-2 text-sm text-white">
                Confirmar promoção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
