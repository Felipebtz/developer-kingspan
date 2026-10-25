
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Eye, Plus, Search } from "lucide-react";

import { useRequests } from "@/lib/hooks/useRequests";
import type { RequestStatus } from "@/lib/api/requests";
import type { AuthState } from "@/lib/redux/auth/authSlice";

const statusConfig: Record<
  RequestStatus,
  { label: string; color: string }
> = {
  DRAFT: {
    label: "Rascunho",
    color: "text-[#111827]",
  },
  PENDING_APPROVAL: {
    label: "Em aprovação",
    color: "text-[#A16207]",
  },
  CHANGES_REQUESTED: {
    label: "Alterações solicitadas",
    color: "text-[#9333EA]",
  },
  APPROVED: {
    label: "Aprovada",
    color: "text-[#004289]",
  },
  REJECTED: {
    label: "Rejeitada",
    color: "text-[#DC2626]",
  },
  CANCELLED: {
    label: "Cancelada",
    color: "text-slate-500",
  },
};

const categoryLabels: Record<string, string> = {
  EQUIPMENT: "Equipamentos",
  SERVICES: "Serviços",
  SUPPLIES: "Materiais",
  TRAVEL: "Viagens",
  SOFTWARE: "Software",
  OTHER: "Outros",
};

const filters: {
  label: string;
  value: RequestStatus | "ALL";
}[] = [
  { label: "Todas", value: "ALL" },
  { label: "Rascunhos", value: "DRAFT" },
  { label: "Em aprovação", value: "PENDING_APPROVAL" },
  {
    label: "Alterações solicitadas",
    value: "CHANGES_REQUESTED",
  },
  { label: "Aprovadas", value: "APPROVED" },
  { label: "Rejeitadas", value: "REJECTED" },
  { label: "Canceladas", value: "CANCELLED" },
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function RequestsPage() {
  // Dados reais carregados de GET /requests
  const { requests, loading, error } = useRequests();

  const user = useSelector(
    (state: { auth: AuthState }) => state.auth.user
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<RequestStatus | "ALL">("ALL");

  const canCreate = user?.role === "SOLICITANTE";

  const filteredRequests = requests.filter((request) => {
    const query = search.trim().toLowerCase();

    const category =
      categoryLabels[request.category] ?? request.category;

    const matchesSearch =
      request.title.toLowerCase().includes(query) ||
      category.toLowerCase().includes(query) ||
      String(request.id).includes(query);

    const matchesStatus =
      status === "ALL" || request.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Minhas solicitações
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consulte e acompanhe suas solicitações de compra.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/requests/new"
            className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm font-medium text-white hover:bg-[#003670]"
          >
            <Plus className="size-4" />
            Nova solicitação
          </Link>
        )}
      </div>

      {/* TABELA E FILTROS */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Solicitações de compra
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Solicitações carregadas do sistema
            </p>
          </div>

          {/* BUSCA */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />

            <input
              type="search"
              placeholder="Buscar por número, título ou categoria"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#004289]"
            />
          </div>

          {/* FILTROS */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = status === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatus(filter.value)}
                  className={`cursor-pointer rounded px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#004289] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-5 py-3 font-semibold">
                  Solicitação
                </th>
                <th className="px-5 py-3 font-semibold">
                  Categoria
                </th>
                <th className="px-5 py-3 font-semibold">
                  Data
                </th>
                <th className="px-5 py-3 font-semibold">
                  Valor
                </th>
                <th className="px-5 py-3 font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 text-center font-semibold">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {/* CARREGAMENTO */}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Carregando solicitações...
                  </td>
                </tr>
              )}

              {/* ERRO */}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={6}
                    role="alert"
                    className="px-5 py-10 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {/* SOLICITAÇÕES REAIS */}
              {!loading &&
                !error &&
                filteredRequests.map((request, index) => {
                  const requestStatus =
                    statusConfig[request.status];

                  const category =
                    categoryLabels[request.category] ??
                    request.category;

                  return (
                    <tr
                      key={request.id}
                      className={`border-b border-slate-200 hover:bg-blue-50 ${
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-[#F5F7FA]"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {request.title}
                        </p>

                        <span className="text-xs text-slate-500">
                          #{request.id}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {category}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {request.date}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {request.amount === null
                          ? "—"
                          : currency.format(request.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${requestStatus.color}`}
                        >
                          {requestStatus.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/dashboard/requests/${request.id}`}
                          className="inline-flex h-8 items-center gap-2 rounded bg-[#004289] px-3 text-xs font-medium text-white hover:bg-[#003670]"
                        >
                          <Eye className="size-3.5" />
                          Visualizar
                        </Link>
                      </td>
                    </tr>
                  );
                })}

              {/* LISTA VAZIA */}
              {!loading &&
                !error &&
                filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      {requests.length === 0
                        ? "Nenhuma solicitação cadastrada."
                        : "Nenhuma solicitação encontrada para os filtros selecionados."}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ */}
        <div className="border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
          {loading
            ? "Carregando dados..."
            : error
              ? "Erro ao carregar solicitações."
              : `Exibindo ${filteredRequests.length} de ${requests.length} solicitações carregadas`}
        </div>
      </div>
    </div>
  );
}
