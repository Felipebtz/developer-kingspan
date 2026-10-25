"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { ArrowLeft, Pencil, Send } from "lucide-react";

import type { AuthState } from "@/lib/redux/auth/authSlice";
import {
  brl,
  canEditRequest,
  formatDate,
  requestActionsApi,
  requestCategories,
  requestStatusDisplay,
  type RequestDetailsDTO,
} from "@/lib/api/requests-action";

function Info({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{title}</p>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { user, accessToken } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const validId = Number.isSafeInteger(id) && id > 0;
  const requestKey = `${accessToken ?? ""}:${id}`;

  const [response, setResponse] = useState<{
    key: string;
    data: RequestDetailsDTO | null;
    error: string;
  } | null>(null);

  const [sending, setSending] = useState(false);

  const [actionError, setActionError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const current = response?.key === requestKey ? response : null;
  const request = current?.data ?? null;

  const loading = Boolean(accessToken) && validId && !current;
  const error =
    actionError?.key === requestKey
      ? actionError.message
      : "";

  useEffect(() => {
    if (!accessToken || !validId) return;

    let active = true;

    requestActionsApi
      .byId(id)
      .then((data) => {
        if (active) {
          setResponse({
            key: requestKey,
            data,
            error: "",
          });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setResponse({
            key: requestKey,
            data: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Erro ao carregar solicitação.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id, accessToken, validId, requestKey]);

  async function sendForApproval() {
    if (!request || sending) return;

    setSending(true);
    setActionError(null);

    try {
      await requestActionsApi.submit(
        request.id,
        request.lockVersion
      );

      const latest = await requestActionsApi.byId(request.id);

      setResponse({
        key: requestKey,
        data: latest,
        error: "",
      });

      router.refresh();
    } catch (cause: unknown) {
      setActionError({
        key: requestKey,
        message:
          cause instanceof Error
            ? cause.message
            : "Não foi possível enviar para aprovação.",
      });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded border bg-white p-6 text-slate-600">
        Carregando solicitação...
      </p>
    );
  }

  if (!request) {
    return (
      <div className="rounded border bg-white p-6">
        <h1 className="text-xl font-semibold">
          Não foi possível carregar a solicitação
        </h1>

        <p role="alert" className="mt-2 text-sm text-red-600">
          {error ||
            current?.error ||
            (!accessToken
              ? "Sessão não encontrada."
              : !validId
                ? "Identificador inválido."
                : "Solicitação não encontrada.")}
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

  const status = requestStatusDisplay[request.status];

  const category =
    requestCategories.find(
      (row) => row.value === request.category
    )?.label ??
    request.category ??
    "—";

  const editable = canEditRequest(request, user?.id);

  return (
    <div className="space-y-6">
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
              {request.title || "Rascunho sem título"}
            </p>
          </div>

          {editable && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/requests/${request.id}/edit`}
                className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm text-white"
              >
                <Pencil className="size-4" />
                Editar solicitação
              </Link>

              {request.status === "DRAFT" && (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void sendForApproval()}
                  className="inline-flex h-10 items-center gap-2 rounded border border-[#004289] px-4 text-sm text-[#004289] disabled:opacity-50"
                >
                  <Send className="size-4" />
                  {sending
                    ? "Enviando..."
                    : "Enviar para aprovação"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Dados da solicitação
          </h2>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <Info title="Título">
            {request.title || "Não informado"}
          </Info>

          <Info title="Status">
            <span className={`font-semibold ${status?.color ?? ""}`}>
              {status?.label ?? request.status}
            </span>
          </Info>

          <Info title="Categoria">{category}</Info>

          <Info title="Data de criação">
            {formatDate(request.createdAt)}
          </Info>

          <div className="md:col-span-2">
            <Info title="Justificativa">
              {request.description || "Não informada"}
            </Info>
          </div>

          <Info title="Data de necessidade">
            {formatDate(request.neededBy)}
          </Info>

          <Info title="Centro de custo">
            #{request.costCenterId}
          </Info>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Itens da solicitação
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Quantidade</th>
                <th className="px-5 py-3">Valor unitário</th>
                <th className="px-5 py-3">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {(request.items ?? []).map((item, index) => (
                <tr
                  key={item.id ?? index}
                  className={`border-b ${
                    index % 2 ? "bg-[#F5F7FA]" : "bg-white"
                  }`}
                >
                  <td className="px-5 py-4">
                    {item.description}
                  </td>

                  <td className="px-5 py-4">
                    {item.quantity}
                  </td>

                  <td className="px-5 py-4">
                    {brl.format(Number(item.unitPrice))}
                  </td>

                  <td className="px-5 py-4 font-medium">
                    {brl.format(
                      item.subtotal == null
                        ? Number(item.quantity) *
                            Number(item.unitPrice)
                        : Number(item.subtotal)
                    )}
                  </td>
                </tr>
              ))}

              {(!request.items || request.items.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    Nenhum item adicionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-slate-50 px-5 py-4 text-right">
          <span className="mr-4 text-sm text-slate-600">
            Valor total
          </span>

          <span className="text-xl font-semibold text-[#004289]">
            {brl.format(Number(request.totalAmount ?? 0))}
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Histórico da solicitação
          </h2>
        </div>

        <div className="space-y-4 p-5 text-sm">
          {request.auditEvents?.length ? (
            request.auditEvents.map((event, index) => (
              <div
                key={event.id ?? index}
                className="border-b pb-3 last:border-0"
              >
                <p className="font-medium text-slate-800">
                  {event.action ?? "Evento"}
                </p>

                <p className="text-slate-500">
                  {formatDate(event.createdAt)}
                  {event.userRole
                    ? ` · ${event.userRole}`
                    : ""}
                </p>

                {event.comments && (
                  <p className="mt-1 whitespace-pre-wrap">
                    {event.comments}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-slate-500">
              Os eventos de auditoria não foram disponibilizados
              nesta resposta da API.
            </p>
          )}

          {!!request.approvalSteps?.length && (
            <div className="border-t pt-4">
              <h3 className="mb-3 font-semibold">
                Etapas de aprovação
              </h3>

              {request.approvalSteps.map((step, index) => (
                <p
                  key={step.id ?? index}
                  className="py-1 text-slate-600"
                >
                  Etapa {step.stepOrder ?? index + 1}:{" "}
                  {step.requiredLevel ?? "—"} ·{" "}
                  {step.status ?? "—"}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}