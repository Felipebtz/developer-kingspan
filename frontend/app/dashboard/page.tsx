
import Link from "next/link";

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Plus,
  Eye,
} from "lucide-react";

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

// Dados fictícios para demonstração visual
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

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function DashboardPage() {
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
        (request) => request.status === "IN_APPROVAL"
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
              {value}
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
              {requests.map((request, index) => {
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
                    {/* SOLICITAÇÃO */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {request.title}
                      </p>

                      <span className="text-xs text-slate-500">
                        #{request.id}
                      </span>
                    </td>

                    {/* CATEGORIA */}
                    <td className="px-5 py-4 text-slate-700">
                      {request.category}
                    </td>

                    {/* DATA */}
                    <td className="px-5 py-4 text-slate-700">
                      {request.date}
                    </td>

                    {/* VALOR */}
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {currency.format(request.amount)}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* AÇÕES */}
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
            </tbody>
          </table>
        </div>

        {/* RODAPÉ DA TABELA */}
        <div className="border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
          Exibindo {requests.length} solicitações · Dados demonstrativos
        </div>
      </div>
    </div>
  );
}
