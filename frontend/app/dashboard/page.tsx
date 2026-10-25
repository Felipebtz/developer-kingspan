
"use client";

import Link from "next/link";

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Plus,
  Eye,
} from "lucide-react";

import { useRequests } from "@/lib/hooks/useRequests";
import type { RequestStatus } from "@/lib/api/requests";

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

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function DashboardPage() {
  const { requests, loading, error } = useRequests();

  const stats = [
    {
      title: "Rascunhos",
      value: requests.filter(
        (request) => request.status === "DRAFT"
      ).length,
      Icon: ClipboardList,
      color: "text-[#111827]",
    },
    {
      title: "Em aprovação",
      value: requests.filter(
        (request) => request.status === "PENDING_APPROVAL"
      ).length,
      Icon: Clock3,
      color: "text-[#A16207]",
    },
    {
      title: "Aprovadas",
      value: requests.filter(
        (request) => request.status === "APPROVED"
      ).length,
      Icon: CheckCircle2,
      color: "text-[#004289]",
    },
  ];

  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe suas solicitações de compra.
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

      {/* INDICADORES */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map(({ title, value, Icon, color }) => (
          <div
            key={title}
            className="rounded-md border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {title}
              </span>

              <Icon className={`size-5 ${color}`} />
            </div>

            <p className={`mt-3 text-3xl font-semibold ${color}`}>
              {loading || error ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* SOLICITAÇÕES RECENTES */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Solicitações recentes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Últimas solicitações cadastradas
            </p>
          </div>

          <Link
            href="/dashboard/requests"
            className="text-sm font-medium text-[#004289] hover:underline"
          >
            Ver todas
          </Link>
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

              {!loading &&
                !error &&
                recentRequests.map((request, index) => {
                  const status = statusConfig[request.status];

                  return (
                    <tr
                      key={request.id}
                      className={`border-b border-slate-200 transition-colors hover:bg-blue-50 ${
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
                        {categoryLabels[request.category] ??
                          request.category}
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
                        <span className={`font-semibold ${status.color}`}>
                          {status.label}
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

              {!loading && !error && recentRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Nenhuma solicitação cadastrada.
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
              ? "Não foi possível carregar os dados."
              : `Exibindo ${recentRequests.length} solicitações carregadas`}
        </div>
      </div>
    </div>
  );
}
