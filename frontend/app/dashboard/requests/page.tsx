
"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";

type RequestStatus =
  | "DRAFT"
  | "IN_APPROVAL"
  | "APPROVED"
  | "REJECTED";

type PurchaseRequest = {
  id: number;
  title: string;
  category: string;
  date: string;
  amount: number;
  status: RequestStatus;
};

// Dados demonstrativos
const requests: PurchaseRequest[] = [
  {
    id: 1042,
    title: "Computadores para equipe",
    category: "Equipamentos",
    date: "24/10/2026",
    amount: 6800,
    status: "IN_APPROVAL",
  },
  {
    id: 1041,
    title: "Licenças de software",
    category: "Software",
    date: "23/10/2026",
    amount: 2450,
    status: "IN_APPROVAL",
  },
  {
    id: 1040,
    title: "Materiais de manutenção",
    category: "Manutenção",
    date: "22/10/2026",
    amount: 980,
    status: "DRAFT",
  },
  {
    id: 1039,
    title: "Serviço de calibração",
    category: "Serviços",
    date: "20/10/2026",
    amount: 1400,
    status: "APPROVED",
  },
  {
    id: 1038,
    title: "Materiais de escritório",
    category: "Materiais",
    date: "18/10/2026",
    amount: 720,
    status: "REJECTED",
  },
];

const statusConfig: Record<
  RequestStatus,
  { label: string; color: string }
> = {
  DRAFT: {
    label: "Rascunho",
    color: "text-[#111827]",
  },
  IN_APPROVAL: {
    label: "Em aprovação",
    color: "text-[#A16207]",
  },
  APPROVED: {
    label: "Aprovada",
    color: "text-[#004289]",
  },
  REJECTED: {
    label: "Rejeitada",
    color: "text-[#DC2626]",
  },
};

const filters: {
  label: string;
  value: RequestStatus | "ALL";
}[] = [
  { label: "Todas", value: "ALL" },
  { label: "Rascunhos", value: "DRAFT" },
  { label: "Em aprovação", value: "IN_APPROVAL" },
  { label: "Aprovadas", value: "APPROVED" },
  { label: "Rejeitadas", value: "REJECTED" },
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<RequestStatus | "ALL">("ALL");

  const filteredRequests = requests.filter((request) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      request.title.toLowerCase().includes(query) ||
      request.category.toLowerCase().includes(query) ||
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

        <Link
          href="/dashboard/requests/new"
          className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm font-medium text-white hover:bg-[#003670]"
        >
          <Plus className="size-4" />
          Nova solicitação
        </Link>
      </div>

      {/* TABELA E FILTROS */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Solicitações de compra
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Dados demonstrativos
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
              {filteredRequests.map((request, index) => {
                const requestStatus =
                  statusConfig[request.status];

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
                      {request.category}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {request.date}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {currency.format(request.amount)}
                    </td>

                    {/* STATUS SEM BADGE */}
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

              {filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ */}
        <div className="border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
          Exibindo {filteredRequests.length} de{" "}
          {requests.length} solicitações · Dados demonstrativos
        </div>
      </div>
    </div>
  );
}
