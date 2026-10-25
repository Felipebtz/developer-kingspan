
"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";

import {
  calculateTotal,
  categories,
  currency,
  getRequest,
  itemNumber,
  saveRequest,
  type PurchaseRequest,
  type RequestItem,
  type RequestStatus,
} from "@/lib/demo-requests";

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<PurchaseRequest | null>(() => {
    const requestId = Number(id);
    return Number.isSafeInteger(requestId)
      ? getRequest(requestId) ?? null
      : null;
  });
  const [error, setError] = useState("");

  if (!request) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">
          Solicitação não encontrada
        </h1>
        <Link
          href="/dashboard/requests"
          className="text-sm text-[#004289]"
        >
          Voltar às solicitações
        </Link>
      </div>
    );
  }

  // REGRA: APENAS RASCUNHO PODE SER EDITADO.
  if (request.status !== "DRAFT") {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Edição não permitida
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Esta solicitação já saiu do estado de rascunho.
          Somente solicitações em DRAFT podem ser editadas.
        </p>

        <Link
          href={`/dashboard/requests/${request.id}`}
          className="mt-5 inline-block text-sm font-medium text-[#004289]"
        >
          Visualizar solicitação
        </Link>
      </div>
    );
  }

  const total = calculateTotal(request.items);

  const updateRequest = (
    field: "title" | "description" | "category" | "neededBy",
    value: string
  ) => {
    setRequest((current) =>
      current ? { ...current, [field]: value } : null
    );
  };

  const updateItem = (
    itemId: number,
    field: "description" | "quantity" | "unitPrice",
    value: string
  ) => {
    setRequest((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === itemId
                ? { ...item, [field]: value }
                : item
            ),
          }
        : null
    );
  };

  const addItem = () => {
    const nextId =
      Math.max(0, ...request.items.map((item) => item.id)) + 1;

    const newItem: RequestItem = {
      id: nextId,
      description: "",
      quantity: "1",
      unitPrice: "",
    };

    setRequest((current) =>
      current
        ? { ...current, items: [...current.items, newItem] }
        : null
    );
  };

  const removeItem = (itemId: number) => {
    if (request.items.length <= 1) return;

    setRequest((current) =>
      current
        ? {
            ...current,
            items: current.items.filter(
              (item) => item.id !== itemId
            ),
          }
        : null
    );
  };

  const persist = (nextStatus: RequestStatus) => {
    if (!request || request.status !== "DRAFT") return;

    if (nextStatus === "IN_APPROVAL") {
      if (
        !request.title.trim() ||
        !request.description.trim() ||
        !request.category
      ) {
        setError("Preencha os dados obrigatórios.");
        return;
      }

      const validItems = request.items.every(
        (item) =>
          item.description.trim() &&
          itemNumber(item.quantity) > 0 &&
          Number.isInteger(itemNumber(item.quantity)) &&
          itemNumber(item.unitPrice) > 0
      );

      if (!validItems || total <= 0) {
        setError("Verifique a descrição, quantidade e valor dos itens.");
        return;
      }
    }

    setError("");

    try {
      saveRequest({
        ...request,
        amount: total,
        status: nextStatus,
      });

      router.push(`/dashboard/requests/${request.id}`);
    } catch {
      setError("Não foi possível salvar as alterações neste navegador.");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    persist("IN_APPROVAL");
  };

  const fieldClass =
    "h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#004289]";

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <Link
          href={`/dashboard/requests/${request.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#004289]"
        >
          <ArrowLeft className="size-4" />
          Voltar aos detalhes
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900">
          Editar rascunho #{request.id}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Altere os dados antes de enviar para aprovação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DADOS GERAIS */}
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Dados da solicitação
            </h2>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="edit-title"
                className="mb-2 block text-sm font-medium"
              >
                Título *
              </label>

              <input
                id="edit-title"
                className={fieldClass}
                required
                value={request.title}
                onChange={(e) =>
                  updateRequest("title", e.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="edit-category"
                className="mb-2 block text-sm font-medium"
              >
                Categoria *
              </label>

              <select
                id="edit-category"
                className={fieldClass}
                required
                value={request.category}
                onChange={(e) =>
                  updateRequest("category", e.target.value)
                }
              >
                <option value="">Selecione</option>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-needed"
                className="mb-2 block text-sm font-medium"
              >
                Data de necessidade
              </label>

              <input
                id="edit-needed"
                type="date"
                className={fieldClass}
                value={request.neededBy ?? ""}
                onChange={(e) =>
                  updateRequest("neededBy", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="edit-description"
                className="mb-2 block text-sm font-medium"
              >
                Justificativa *
              </label>

              <textarea
                id="edit-description"
                rows={4}
                className={`${fieldClass} h-auto py-3`}
                required
                value={request.description}
                onChange={(e) =>
                  updateRequest("description", e.target.value)
                }
              />
            </div>
          </div>
        </section>

        {/* ITENS */}
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Itens da solicitação
            </h2>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex h-9 items-center gap-2 rounded bg-[#004289] px-3 text-sm text-white"
            >
              <Plus className="size-4" />
              Adicionar item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#004289] text-white">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3">Valor unitário</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Ação</th>
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
                    <td className="px-4 py-3">
                      <input
                        className={fieldClass}
                        required
                        value={item.description}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={fieldClass}
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={fieldClass}
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "unitPrice",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {currency.format(
                        itemNumber(item.quantity) *
                        itemNumber(item.unitPrice)
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={request.items.length === 1}
                        onClick={() => removeItem(item.id)}
                        className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                        aria-label={`Remover item ${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t bg-slate-50 px-5 py-4 text-right">
            <p className="text-sm text-slate-500">Valor total</p>
            <p className="text-xl font-semibold text-[#004289]">
              {currency.format(total)}
            </p>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* AÇÕES */}
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href={`/dashboard/requests/${request.id}`}
            className="inline-flex h-10 items-center rounded border border-slate-300 bg-white px-4 text-sm text-slate-700"
          >
            Cancelar
          </Link>

          <button
            type="button"
            onClick={() => persist("DRAFT")}
            className="inline-flex h-10 items-center gap-2 rounded border border-[#004289] bg-white px-4 text-sm font-medium text-[#004289]"
          >
            <Save className="size-4" />
            Salvar alterações
          </button>

          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm font-medium text-white hover:bg-[#003670]"
          >
            <Send className="size-4" />
            Enviar para aprovação
          </button>
        </div>
      </form>
    </div>
  );
}
