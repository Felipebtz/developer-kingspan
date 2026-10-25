
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Search,
  Check,
  X,
  ClipboardCheck,
} from "lucide-react";

import {
  getAllRequests,
  saveRequest,
  currency,
  categoryLabel,
  statusConfig,
  type PurchaseRequest,
} from "@/lib/demo-requests";

type ApproverLevel = "NIVEL_1" | "NIVEL_2" | "ADMIN";

// Somente para demonstração.
// Posteriormente virá do usuário autenticado.
const DEMO_APPROVER: {
  name: string;
  level: ApproverLevel;
  costCenterId: number;
} = {
  name: "Aprovador de demonstração",
  level: "NIVEL_1",
  costCenterId: 1,
};

type Decision = "APPROVE" | "REJECT";

type ApprovalHistory = {
  requestId: number;
  decision: Decision;
  approver: string;
  level: ApproverLevel;
  reason?: string;
  date: string;
};

const HISTORY_KEY = "kingspan-demo-approval-history";

function getHistory(): ApprovalHistory[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const inputClass =
  "h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#004289]";

export default function ApprovalsPage() {
  const [requests, setRequests] =
    useState<PurchaseRequest[]>(() =>
      getAllRequests().filter((item) => item.status === "IN_APPROVAL")
    );

  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<PurchaseRequest | null>(null);

  const [decision, setDecision] =
    useState<Decision | null>(null);

  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadRequests = () => {
    const all = getAllRequests();
    setRequests(all.filter((item) => item.status === "IN_APPROVAL"));
  };

  const filteredRequests = requests.filter((request) => {
    const query = search.trim().toLowerCase();

    return (
      request.title.toLowerCase().includes(query) ||
      String(request.id).includes(query) ||
      categoryLabel(request.category)
        .toLowerCase()
        .includes(query)
    );
  });

  const openDecision = (
    request: PurchaseRequest,
    nextDecision: Decision
  ) => {
    setSelected(request);
    setDecision(nextDecision);
    setReason("");
    setError("");
    setMessage("");
  };

  const closeDecision = () => {
    if (processing) return;

    setSelected(null);
    setDecision(null);
    setReason("");
    setError("");
  };

  const confirmDecision = () => {
    if (!selected || !decision || processing) return;

    if (decision === "REJECT" && !reason.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Releitura para evitar decisão repetida na interface.
      const current = getAllRequests().find(
        (item) => item.id === selected.id
      );

      if (!current || current.status !== "IN_APPROVAL") {
        setError("A solicitação já foi processada.");
        loadRequests();
        return;
      }

      const history = getHistory();

      if (
        history.some(
          (entry) =>
            entry.requestId === current.id &&
            entry.level === DEMO_APPROVER.level
        )
      ) {
        setError(
          "Já existe uma decisão registrada para este nível."
        );
        return;
      }

      const entry: ApprovalHistory = {
        requestId: current.id,
        decision,
        approver: DEMO_APPROVER.name,
        level: DEMO_APPROVER.level,
        reason: decision === "REJECT" ? reason.trim() : undefined,
        date: new Date().toLocaleString("pt-BR"),
      };

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify([...history, entry])
      );

      // Demonstração simplificada.
      // NÃO reproduz a cadeia real NIVEL_1 -> NIVEL_2 -> ADMIN.
      if (decision === "REJECT") {
        saveRequest({
          ...current,
          status: "REJECTED",
        });
      } else {
        // Mantemos IN_APPROVAL porque a próxima etapa
        // depende das regras de alçada do backend.
        saveRequest({
          ...current,
          status: "IN_APPROVAL",
        });
      }

      setMessage(
        decision === "APPROVE"
          ? "Aprovação demonstrativa registrada para o nível atual."
          : "Rejeição demonstrativa registrada."
      );

      setSelected(null);
      setDecision(null);
      setReason("");

      loadRequests();
    } catch {
      setError(
        "Não foi possível registrar a decisão demonstrativa."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Aprovações
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Analise as solicitações pendentes de aprovação.
        </p>
      </div>

      {/* PERFIL */}
      <div className="rounded border border-slate-200 bg-white px-5 py-4">
        <p className="text-sm font-medium text-slate-800">
          {DEMO_APPROVER.name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Nível: {DEMO_APPROVER.level} · Centro de custo:{" "}
          {DEMO_APPROVER.costCenterId}
        </p>
      </div>

      {/* MENSAGEM */}
      {message && (
        <div
          role="status"
          className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#004289]"
        >
          {message}
        </div>
      )}

      {/* TABELA */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Solicitações pendentes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Dados demonstrativos
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />

            <input
              type="search"
              placeholder="Buscar solicitação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
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
                const status = statusConfig[request.status];

                const processed = getHistory().some(
                  (entry) =>
                    entry.requestId === request.id &&
                    entry.level === DEMO_APPROVER.level
                );

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
                      {categoryLabel(request.category)}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {request.date}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {currency.format(request.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`font-semibold ${status.color}`}>
                        {processed ? "Decidida neste nível" : status.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/dashboard/requests/${request.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded bg-[#004289] px-3 text-xs font-medium text-white hover:bg-[#003670]"
                        >
                          <Eye className="size-3.5" />
                          Visualizar
                        </Link>

                        {!processed && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openDecision(request, "APPROVE")
                              }
                              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-[#004289] px-3 text-xs font-medium text-[#004289] hover:bg-blue-50"
                            >
                              <Check className="size-3.5" />
                              Aprovar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDecision(request, "REJECT")
                              }
                              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-red-600 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <X className="size-3.5" />
                              Rejeitar
                            </button>
                          </>
                        )}
                      </div>
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
                    Nenhuma solicitação pendente encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-5 py-3 text-xs text-slate-500">
          {filteredRequests.length} solicitações exibidas
        </div>
      </div>

      {/* MODAL DE DECISÃO */}
      {selected && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-dialog-title"
            className="w-full max-w-md rounded-md bg-white p-6 shadow-lg"
          >
            <div className="mb-5 flex items-center gap-3">
              <ClipboardCheck className="size-5 text-[#004289]" />

              <h2
                id="approval-dialog-title"
                className="text-lg font-semibold text-slate-900"
              >
                {decision === "APPROVE"
                  ? "Confirmar aprovação"
                  : "Rejeitar solicitação"}
              </h2>
            </div>

            <p className="text-sm text-slate-600">
              Solicitação #{selected.id}
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {selected.title}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Valor: {currency.format(selected.amount)}
            </p>

            {decision === "REJECT" && (
              <div className="mt-5">
                <label
                  htmlFor="rejection-reason"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Motivo da rejeição *
                </label>

                <textarea
                  id="rejection-reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Informe a justificativa..."
                  className="w-full rounded border border-slate-300 p-3 text-sm outline-none focus:border-[#004289]"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={closeDecision}
                className="h-10 rounded border border-slate-300 px-4 text-sm text-slate-700"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={confirmDecision}
                className={`h-10 rounded px-4 text-sm font-medium text-white disabled:opacity-50 ${
                  decision === "APPROVE"
                    ? "bg-[#004289] hover:bg-[#003670]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing
                  ? "Processando..."
                  : decision === "APPROVE"
                    ? "Confirmar aprovação"
                    : "Confirmar rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
