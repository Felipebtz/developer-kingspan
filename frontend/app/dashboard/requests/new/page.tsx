
"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  CheckCircle2,
} from "lucide-react";

import { Input } from "@/components/ui/input";

type RequestItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

type RequestStatus = "DRAFT" | "IN_APPROVAL";

const categories = [
  { value: "EQUIPAMENTOS", label: "Equipamentos" },
  { value: "MATERIAIS", label: "Materiais" },
  { value: "SOFTWARE", label: "Software" },
  { value: "SERVICOS", label: "Serviços" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "OUTROS", label: "Outros" },
];

// Categorias demonstrativas; ajustar aos enums reais da API.
const STORAGE_KEY = "kingspan-demo-requests";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function newItem(id: number): RequestItem {
  return {
    id,
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

function toNumber(value: string): number {
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export default function NewRequestPage() {
  const nextItemId = useRef(2);
  const requestId = useRef<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [neededBy, setNeededBy] = useState("");

  const [items, setItems] = useState<RequestItem[]>([
    newItem(1),
  ]);

  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitted = status === "IN_APPROVAL";

  const total = items.reduce((sum, item) => {
    const quantity = toNumber(item.quantity);
    const price = toNumber(item.unitPrice);
    return sum + quantity * price;
  }, 0);

  const addItem = () => {
    setItems((current) => [
      ...current,
      newItem(nextItemId.current++),
    ]);
    setMessage("");
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;

    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
    setMessage("");
  };

  const updateItem = (
    id: number,
    field: keyof Omit<RequestItem, "id">,
    value: string
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
    setMessage("");
  };

  // Persistência exclusivamente demonstrativa.
  function saveDemo(nextStatus: RequestStatus) {
    if (submitted) return;

    if (nextStatus === "IN_APPROVAL") {
      const validItems = items.every(
        (item) =>
          item.description.trim().length > 0 &&
          toNumber(item.quantity) > 0 &&
          toNumber(item.unitPrice) > 0
      );

      if (!title.trim() || !description.trim() || !category) {
        setError("Preencha os dados da solicitação.");
        return;
      }

      if (!validItems || total <= 0) {
        setError("Informe itens com quantidade e valor válidos.");
        return;
      }
    }

    setError("");

    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];

      const existing: unknown[] = Array.isArray(parsed)
        ? parsed
        : [];

      const nextRequestId = Math.max(
        0,
        ...existing.map((entry) => {
          if (!entry || typeof entry !== "object") return 0;
          const id = (entry as { id?: unknown }).id;
          return typeof id === "number" && Number.isFinite(id) ? id : 0;
        })
      ) + 1;
      const id = requestId.current ?? nextRequestId;

      const record = {
        id,
        title,
        description,
        category,
        neededBy,
        items,
        amount: total,
        status: nextStatus,
        date: new Date().toLocaleDateString("pt-BR"),
      };

      const updated = [
        ...existing.filter((entry) => {
          if (!entry || typeof entry !== "object") return false;
          return (entry as { id?: number }).id !== id;
        }),
        record,
      ];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      requestId.current = id;
      setStatus(nextStatus);

      setMessage(
        nextStatus === "DRAFT"
          ? "Rascunho salvo localmente para demonstração."
          : "Envio simulado com sucesso. Nenhuma solicitação foi enviada ao servidor."
      );
    } catch {
      setError("Não foi possível salvar os dados neste navegador.");
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveDemo("IN_APPROVAL");
  };

  const inputClass =
    "h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#004289] focus:ring-1 focus:ring-[#004289]";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <Link
          href="/dashboard/requests"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#004289] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Minhas solicitações
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900">
          Nova solicitação
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Preencha os dados para solicitar uma compra.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitted} className="space-y-6">
          {/* DADOS GERAIS */}
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Dados da solicitação
              </h2>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="title" className={labelClass}>
                  Título da solicitação *
                </label>

                <Input
                  id="title"
                  placeholder="Ex.: Aquisição de notebooks"
                  className={inputClass}
                  required
                  maxLength={255}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="category" className={labelClass}>
                  Categoria *
                </label>

                <select
                  id="category"
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Selecione uma categoria</option>

                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="neededBy" className={labelClass}>
                  Data de necessidade
                </label>

                <Input
                  id="neededBy"
                  type="date"
                  className={inputClass}
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className={labelClass}>
                  Justificativa / descrição *
                </label>

                <textarea
                  id="description"
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a finalidade desta compra..."
                  className={`${inputClass} h-auto min-h-28 resize-y py-3`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Centro de custo
                </label>

                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  Centro de custo vinculado ao solicitante
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Será identificado automaticamente pelo usuário autenticado.
                </p>
              </div>
            </div>

            {category === "SOFTWARE" && (
              <p className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-[#004289]">
                Solicitações de software exigem aprovação final do ADMIN.
              </p>
            )}
          </section>

          {/* ITENS */}
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Itens da solicitação
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Informe os produtos ou serviços desejados.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded bg-[#004289] px-3 text-sm font-medium text-white hover:bg-[#003670]"
              >
                <Plus className="size-4" />
                Adicionar item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] border-collapse text-left text-sm">
                <thead className="bg-[#004289] text-white">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center font-semibold">
                      #
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Descrição
                    </th>
                    <th className="w-28 px-4 py-3 font-semibold">
                      Quantidade
                    </th>
                    <th className="w-36 px-4 py-3 font-semibold">
                      Valor unitário
                    </th>
                    <th className="w-36 px-4 py-3 font-semibold">
                      Subtotal
                    </th>
                    <th className="w-16 px-4 py-3 text-center font-semibold">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const subtotal =
                      toNumber(item.quantity) *
                      toNumber(item.unitPrice);

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-200 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-[#F5F7FA]"
                        }`}
                      >
                        <td className="px-4 py-4 text-center text-slate-600">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="text"
                            required
                            placeholder="Descrição do item"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "description",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            placeholder="0,00"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unitPrice",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-800">
                          {currency.format(subtotal)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            title="Remover item"
                            aria-label={`Remover item ${index + 1}`}
                            className="cursor-pointer rounded p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TOTAL */}
            <div className="flex justify-end border-t border-slate-200 bg-[#F5F7FA] px-6 py-5">
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  Valor total da solicitação
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#004289]">
                  {currency.format(total)}
                </p>
              </div>
            </div>
          </section>
        </fieldset>

        {/* MENSAGENS */}
        {error && (
          <div
            role="alert"
            className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded border border-blue-200 bg-blue-50 p-4 text-sm text-[#004289]"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* AÇÕES */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
          <Link
            href="/dashboard/requests"
            className="inline-flex h-10 items-center rounded border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </Link>

          <button
            type="button"
            disabled={submitted}
            onClick={() => saveDemo("DRAFT")}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded border border-[#004289] bg-white px-4 text-sm font-medium text-[#004289] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />
            Salvar rascunho
          </button>

          <button
            type="submit"
            formNoValidate={false}
            disabled={submitted}
            onClick={undefined}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded bg-[#004289] px-4 text-sm font-medium text-white hover:bg-[#003670] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" />
            Enviar para aprovação
          </button>
        </div>
      </form>

      <p className="text-xs text-slate-500">
        Prévia visual. O cálculo exibido é demonstrativo; valores,
        orçamento e regras de aprovação serão validados pelo backend.
      </p>
    </div>
  );
}
