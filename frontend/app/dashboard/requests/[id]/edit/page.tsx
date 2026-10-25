"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";

import type { AuthState } from "@/lib/redux/auth/authSlice";

import {
  brl,
  canEditRequest,
  requestActionsApi,
  requestCategories,
  type RequestCategory,
  type RequestDetailsDTO,
  type RequestItemDTO,
} from "@/lib/api/requests-action"

type FormItem = {
  localId: number;
  apiId?: number | null;
  description: string;
  quantity: string;
  unitPrice: string;
};

const numberOf = (value: string) =>
  Number(value.replace(",", "."));

const fieldClass =
  "h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#004289]";

const labelClass =
  "mb-2 block text-sm font-medium text-slate-700";

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const requestId = Number(id);

  const { user, accessToken } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const [savedOriginal, setOriginal] =
    useState<RequestDetailsDTO | null>(null);

  const [loadedKey, setLoadedKey] =
    useState<string | null>(null);

  const [loadError, setLoadError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const validId =
    Number.isSafeInteger(requestId) && requestId > 0;

  const requestKey = `${accessToken ?? ""}:${requestId}`;

  const loading =
    Boolean(accessToken) &&
    validId &&
    loadedKey !== requestKey;

  const original =
    loadedKey === requestKey ? savedOriginal : null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<RequestCategory | "">("");
  const [neededBy, setNeededBy] = useState("");

  const [items, setItems] = useState<FormItem[]>([]);
  const nextId = useRef(1);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!accessToken || !validId) return;

    let active = true;

    requestActionsApi
      .byId(requestId)
      .then((request) => {
        if (!active) return;

        setOriginal(request);
        setTitle(request.title ?? "");
        setDescription(request.description ?? "");
        setCategory(request.category ?? "");
        setNeededBy(
          request.neededBy?.slice(0, 10) ?? ""
        );

        const formItems = (request.items ?? []).map(
          (item, index) => ({
            localId: index + 1,
            apiId: item.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          })
        );

        setItems(
          formItems.length
            ? formItems
            : [
                {
                  localId: 1,
                  description: "",
                  quantity: "1",
                  unitPrice: "",
                },
              ]
        );

        nextId.current =
          Math.max(
            1,
            ...formItems.map((item) => item.localId)
          ) + 1;

        setLoadError(null);
        setLoadedKey(requestKey);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setOriginal(null);
        setLoadError({
          key: requestKey,
          message:
            cause instanceof Error
              ? cause.message
              : "Erro ao buscar solicitação.",
        });
        setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [requestId, accessToken, validId, requestKey]);

  const total = items.reduce((sum, item) => {
    const amount =
      numberOf(item.quantity) * numberOf(item.unitPrice);

    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  function editItem(
    localId: number,
    field: "description" | "quantity" | "unitPrice",
    value: string
  ) {
    setItems((list) =>
      list.map((item) =>
        item.localId === localId
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  async function persist(submit: boolean) {
    if (inFlight.current || !original) return;

    inFlight.current = true;
    setSaving(true);
    setError("");

    try {
      if (!canEditRequest(original, user?.id)) {
        throw new Error(
          "Edição não permitida para este usuário ou status."
        );
      }

      const validItems: RequestItemDTO[] = items.map(
        (item) => {
          const quantity = numberOf(item.quantity);
          const unitPrice = numberOf(item.unitPrice);

          if (
            !item.description.trim() ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(unitPrice) ||
            unitPrice <= 0
          ) {
            throw new Error(
              "Confira descrição, quantidade inteira e valor positivo dos itens."
            );
          }

          return {
            ...(item.apiId ? { id: item.apiId } : {}),
            description: item.description.trim(),
            quantity,
            unitPrice,
          };
        }
      );

      if (
        submit &&
        (!title.trim() ||
          !description.trim() ||
          !category ||
          !validItems.length)
      ) {
        throw new Error(
          "Informe título, justificativa, categoria e pelo menos um item."
        );
      }

      await requestActionsApi.update(original.id, {
        lockVersion: original.lockVersion,
        costCenterId: original.costCenterId,
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        neededBy: neededBy || null,
        items: validItems,
      });

      const latest = await requestActionsApi.byId(
        original.id
      );

      setOriginal(latest);

      if (submit) {
        await requestActionsApi.submit(
          latest.id,
          latest.lockVersion
        );
      }

      router.push(
        `/dashboard/requests/${original.id}`
      );
      router.refresh();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a solicitação."
      );
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void persist(true);
  }

  if (loading) {
    return (
      <p className="rounded border bg-white p-6 text-slate-600">
        Carregando rascunho...
      </p>
    );
  }

  if (!original) {
    return (
      <div className="rounded border bg-white p-6">
        <h1 className="text-xl font-semibold">
          Solicitação não disponível
        </h1>

        <p
          role="alert"
          className="mt-2 text-sm text-red-600"
        >
          {error ||
            (loadError?.key === requestKey
              ? loadError.message
              : "") ||
            (!accessToken
              ? "Sessão não encontrada."
              : !validId
                ? "ID de solicitação inválido."
                : "Não foi possível obter os dados.")}
        </p>

        <Link
          href="/dashboard/requests"
          className="mt-4 inline-block text-sm text-[#004289]"
        >
          Voltar às solicitações
        </Link>
      </div>
    );
  }

  if (!canEditRequest(original, user?.id)) {
    return (
      <div className="rounded border bg-white p-6">
        <h1 className="text-xl font-semibold">
          Edição não permitida
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Somente o responsável pode editar solicitações em
          DRAFT ou CHANGES_REQUESTED.
        </p>

        <Link
          href={`/dashboard/requests/${original.id}`}
          className="mt-4 inline-block text-sm text-[#004289]"
        >
          Visualizar solicitação
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/requests/${original.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#004289]"
        >
          <ArrowLeft className="size-4" />
          Voltar aos detalhes
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900">
          Editar solicitação #{original.id}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Altere os dados antes de enviar para aprovação.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <fieldset
          disabled={saving}
          className="space-y-6"
        >
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Dados da solicitação
              </h2>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  className={labelClass}
                  htmlFor="edit-title"
                >
                  Título *
                </label>

                <input
                  id="edit-title"
                  required
                  maxLength={255}
                  className={fieldClass}
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="edit-category"
                >
                  Categoria *
                </label>

                <select
                  id="edit-category"
                  required
                  className={fieldClass}
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as
                        | RequestCategory
                        | ""
                    )
                  }
                >
                  <option value="">Selecione</option>

                  {requestCategories.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="edit-needed"
                >
                  Data de necessidade
                </label>

                <input
                  id="edit-needed"
                  type="date"
                  className={fieldClass}
                  value={neededBy}
                  onChange={(e) =>
                    setNeededBy(e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className={labelClass}
                  htmlFor="edit-description"
                >
                  Justificativa *
                </label>

                <textarea
                  id="edit-description"
                  rows={4}
                  required
                  className={`${fieldClass} h-auto py-3`}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Itens da solicitação
              </h2>

              <button
                type="button"
                onClick={() =>
                  setItems((list) => [
                    ...list,
                    {
                      localId: nextId.current++,
                      description: "",
                      quantity: "1",
                      unitPrice: "",
                    },
                  ])
                }
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
                    <th className="px-4 py-3">
                      Descrição
                    </th>
                    <th className="px-4 py-3">
                      Quantidade
                    </th>
                    <th className="px-4 py-3">
                      Valor unitário
                    </th>
                    <th className="px-4 py-3">
                      Subtotal
                    </th>
                    <th className="px-4 py-3">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.localId}
                      className={`border-b ${
                        index % 2
                          ? "bg-[#F5F7FA]"
                          : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Descrição do item ${
                            index + 1
                          }`}
                          required
                          className={fieldClass}
                          value={item.description}
                          onChange={(e) =>
                            editItem(
                              item.localId,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          aria-label={`Quantidade do item ${
                            index + 1
                          }`}
                          required
                          type="number"
                          min="1"
                          step="1"
                          className={fieldClass}
                          value={item.quantity}
                          onChange={(e) =>
                            editItem(
                              item.localId,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          aria-label={`Preço do item ${
                            index + 1
                          }`}
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          className={fieldClass}
                          value={item.unitPrice}
                          onChange={(e) =>
                            editItem(
                              item.localId,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {brl.format(
                          Math.max(
                            0,
                            numberOf(item.quantity) *
                              numberOf(item.unitPrice) || 0
                          )
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() =>
                            setItems((list) =>
                              list.filter(
                                (row) =>
                                  row.localId !==
                                  item.localId
                              )
                            )
                          }
                          className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          aria-label={`Remover item ${
                            index + 1
                          }`}
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
              <p className="text-sm text-slate-500">
                Valor total
              </p>

              <p className="text-xl font-semibold text-[#004289]">
                {brl.format(total)}
              </p>
            </div>
          </section>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href={`/dashboard/requests/${original.id}`}
            className="inline-flex h-10 items-center rounded border px-4 text-sm"
          >
            Cancelar
          </Link>

          <button
            type="button"
            disabled={saving}
            onClick={() => void persist(false)}
            className="inline-flex h-10 items-center gap-2 rounded border border-[#004289] px-4 text-sm text-[#004289] disabled:opacity-50"
          >
            <Save className="size-4" />
            Salvar alterações
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm text-white disabled:opacity-50"
          >
            <Send className="size-4" />
            {saving
              ? "Processando..."
              : "Enviar para aprovação"}
          </button>
        </div>
      </form>
    </div>
  );
}