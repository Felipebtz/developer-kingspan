
"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

type RequestStatus =
  | "DRAFT"
  | "IN_APPROVAL"
  | "APPROVED"
  | "REJECTED";

type RequestItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

type PurchaseRequest = {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  neededBy: string;
  amount: number;
  status: RequestStatus;
  items: RequestItem[];
};

const examples: PurchaseRequest[] = [
  {
    id: 1042,
    title: "Computadores para equipe",
    description: "Aquisição de computadores para a equipe.",
    category: "Equipamentos",
    date: "24/10/2026",
    neededBy: "",
    amount: 6800,
    status: "IN_APPROVAL",
    items: [
      {
        id: 1,
        description: "Computadores",
        quantity: "2",
        unitPrice: "3400",
      },
    ],
  },
  {
    id: 1041,
    title: "Licenças de software",
    description: "Renovação de licenças de software.",
    category: "Software",
    date: "23/10/2026",
    neededBy: "",
    amount: 2450,
    status: "IN_APPROVAL",
    items: [
      {
        id: 1,
        description: "Licença de software",
        quantity: "1",
        unitPrice: "2450",
      },
    ],
  },
  {
    id: 1040,
    title: "Materiais de manutenção",
    description: "Materiais necessários para manutenção.",
    category: "Manutenção",
    date: "22/10/2026",
    neededBy: "",
    amount: 980,
    status: "DRAFT",
    items: [
      {
        id: 1,
        description: "Materiais de manutenção",
        quantity: "1",
        unitPrice: "980",
      },
    ],
  },
  {
    id: 1039,
    title: "Serviço de calibração",
    description: "Contratação de serviço de calibração.",
    category: "Serviços",
    date: "20/10/2026",
    neededBy: "",
    amount: 1400,
    status: "APPROVED",
    items: [
      {
        id: 1,
        description: "Serviço de calibração",
        quantity: "1",
        unitPrice: "1400",
      },
    ],
  },
  {
    id: 1038,
    title: "Materiais de escritório",
    description: "Aquisição de materiais de escritório.",
    category: "Materiais",
    date: "18/10/2026",
    neededBy: "",
    amount: 720,
    status: "REJECTED",
    items: [
      {
        id: 1,
        description: "Materiais de escritório",
        quantity: "1",
        unitPrice: "720",
      },
    ],
  },
];

const statusConfig = {
  DRAFT: { label: "Rascunho", color: "text-[#111827]" },
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

const categoryLabels: Record<string, string> = {
  EQUIPAMENTOS: "Equipamentos",
  MATERIAIS: "Materiais",
  SOFTWARE: "Software",
  SERVICOS: "Serviços",
  MANUTENCAO: "Manutenção",
  OUTROS: "Outros",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const DEMO_REQUESTS_KEY = "kingspan-demo-requests";

function subscribeToStoredRequests(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === DEMO_REQUESTS_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getStoredRequestsSnapshot() {
  return localStorage.getItem(DEMO_REQUESTS_KEY) ?? "[]";
}

function getServerRequestsSnapshot() {
  return "[]";
}

function findRequest(requestId: number, storedRequestsJson: string) {
  let selected = examples.find((item) => item.id === requestId) ?? null;

  try {
    const stored: unknown = JSON.parse(storedRequestsJson);

    if (Array.isArray(stored)) {
      const found = stored.find(
        (item) =>
          item &&
          item.id === requestId &&
          typeof item.title === "string" &&
          Array.isArray(item.items) &&
          ["DRAFT", "IN_APPROVAL", "APPROVED", "REJECTED"].includes(
            item.status
          )
      );

      if (found) {
        selected = found as PurchaseRequest;
      }
    }
  } catch {
    // Mantém dados demonstrativos quando o armazenamento local é inválido.
  }

  return selected;
}

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const storedRequestsJson = useSyncExternalStore(
    subscribeToStoredRequests,
    getStoredRequestsSnapshot,
    getServerRequestsSnapshot
  );
  const request = useMemo(
    () => findRequest(Number(id), storedRequestsJson),
    [id, storedRequestsJson]
  );

  if (!request) {
    return (
      <div className="rounded-md border bg-white p-6">
        <h1 className="text-xl font-semibold">
          Solicitação não encontrada
        </h1>

        <Link
          href="/dashboard/requests"
          className="mt-4 inline-block text-sm text-[#004289]"
        >
          Voltar às solicitações
        </Link>
      </div>
    );
  }

  const status = statusConfig[request.status];
  const category =
    categoryLabels[request.category] ?? request.category;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <Link
          href="/dashboard/requests"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#004289]"
        >
          <ArrowLeft className="size-4" />
          Minhas solicitações
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Solicitação #{request.id}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {request.title}
            </p>
          </div>

          {/* SOMENTE RASCUNHO PODE EDITAR */}
          {request.status === "DRAFT" && (
            <Link
              href={`/dashboard/requests/${request.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm font-medium text-white hover:bg-[#003670]"
            >
              <Pencil className="size-4" />
              Editar rascunho
            </Link>
          )}
        </div>
      </div>

      {/* DADOS GERAIS */}
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Dados da solicitação
          </h2>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Título</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {request.title}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className={`mt-1 text-sm font-semibold ${status.color}`}>
              {status.label}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Categoria</p>
            <p className="mt-1 text-sm text-slate-800">
              {category}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Data de criação
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {request.date}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs text-slate-500">
              Justificativa
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {request.description || "Não informada"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Data de necessidade
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {request.neededBy || "Não informada"}
            </p>
          </div>
        </div>
      </section>

      {/* ITENS DA SOLICITAÇÃO */}
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Itens da solicitação
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-5 py-3 font-semibold">
                  Descrição
                </th>
                <th className="px-5 py-3 font-semibold">
                  Quantidade
                </th>
                <th className="px-5 py-3 font-semibold">
                  Valor unitário
                </th>
                <th className="px-5 py-3 font-semibold">
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody>
              {request.items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-200 ${
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-[#F5F7FA]"
                  }`}
                >
                  <td className="px-5 py-4 text-slate-800">
                    {item.description}
                  </td>

                  <td className="px-5 py-4">
                    {item.quantity}
                  </td>

                  <td className="px-5 py-4">
                    {currency.format(Number(item.unitPrice))}
                  </td>

                  <td className="px-5 py-4 font-medium">
                    {currency.format(
                      Number(item.quantity) *
                      Number(item.unitPrice)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-right">
          <span className="mr-4 text-sm text-slate-600">
            Valor total
          </span>

          <span className="text-xl font-semibold text-[#004289]">
            {currency.format(request.amount)}
          </span>
        </div>
      </section>

      {/* HISTÓRICO */}
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Histórico da solicitação
          </h2>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <div>
            <p className="font-medium text-slate-800">
              Solicitação cadastrada
            </p>
            <p className="text-slate-500">
              {request.date}
            </p>
          </div>

          <div>
            <p className={`font-semibold ${status.color}`}>
              {status.label}
            </p>
            <p className="mt-1 text-slate-500">
              Histórico demonstrativo. As etapas e decisões
              reais serão carregadas após a integração.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
