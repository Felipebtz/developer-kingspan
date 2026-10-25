"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import type { AuthState } from "@/lib/redux/auth/authSlice";
import {
  brl,
  requestActionsApi,
  requestCategories,
  type CreatePurchaseRequestDTO,
  type RequestCategory,
  type RequestItemDTO,
} from "@/lib/api/requests-action";

type FormItem = { localId: number; description: string; quantity: string; unitPrice: string };
const emptyItem = (localId: number): FormItem => ({
  localId, description: "", quantity: "1", unitPrice: "",
});
const numeric = (value: string) => Number(value.replace(",", "."));
const fieldClass = "h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#004289]";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function newKey(): string {
  return crypto.randomUUID();
}

export default function NewRequestPage() {
  const router = useRouter();
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const allowed = user?.role === "SOLICITANTE";

  const nextId = useRef(2);
  const savedId = useRef<number | null>(null);
  const savedVersion = useRef<number | null>(null);
  const idempotency = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory | "">("");
  const [neededBy, setNeededBy] = useState("");
  const [items, setItems] = useState<FormItem[]>([emptyItem(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, item) => {
    const q = numeric(item.quantity);
    const price = numeric(item.unitPrice);
    return sum + (Number.isFinite(q * price) ? q * price : 0);
  }, 0);

  function editItem(localId: number, field: keyof Omit<FormItem, "localId">, value: string) {
    setItems((current) => current.map((item) => item.localId === localId ? { ...item, [field]: value } : item));
  }

  function buildPayload(strict: boolean): CreatePurchaseRequestDTO {
    const completed: RequestItemDTO[] = [];
    for (const item of items) {
      const blank = !item.description.trim() && !item.unitPrice.trim();
      if (!strict && blank) continue;
      const quantity = numeric(item.quantity);
      const unitPrice = numeric(item.unitPrice);
      if (
        !item.description.trim() ||
        !Number.isSafeInteger(quantity) || quantity <= 0 ||
        !Number.isFinite(unitPrice) || unitPrice <= 0
      ) {
        throw new Error("Preencha os itens com descrição, quantidade inteira e preço positivo.");
      }
      completed.push({ description: item.description.trim(), quantity, unitPrice });
    }
    if (strict && (!title.trim() || !description.trim() || !category || !completed.length)) {
      throw new Error("Preencha título, justificativa, categoria e pelo menos um item.");
    }

    const costCenterId = (user as (typeof user & { costCenterId?: number }) | null)?.costCenterId;
    return {
      title: title.trim(),
      description: description.trim(),
      category: category || null,
      neededBy: neededBy || null,
      items: completed,
      ...(Number.isSafeInteger(costCenterId) && costCenterId! > 0 ? { costCenterId } : {}),
    };
  }

  async function saveDraft(payload: CreatePurchaseRequestDTO) {
    if (savedId.current === null) {
      // Uma chave por payload: reuso em retry, nova chave após edição.
      const signature = JSON.stringify(payload);
      if (!idempotency.current || idempotency.current.signature !== signature) {
        idempotency.current = { signature, key: newKey() };
      }
      const created = await requestActionsApi.create(payload, idempotency.current.key);
      if (!Number.isSafeInteger(created?.id) || created.id <= 0) {
        throw new Error("A API não retornou o ID da solicitação criada.");
      }
      savedId.current = created.id;
      savedVersion.current = created.lockVersion;
      return created;
    }
    const lockVersion = savedVersion.current;
    if (lockVersion === null) {
      throw new Error("Não foi possível determinar a versão atual do rascunho.");
    }
    await requestActionsApi.update(savedId.current, { ...payload, lockVersion });
    const latest = await requestActionsApi.byId(savedId.current);
    savedVersion.current = latest.lockVersion;
    return latest;
  }

  async function persist(submit: boolean) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      if (!allowed) throw new Error("Apenas solicitantes podem criar solicitações.");
      const payload = buildPayload(submit);
      const saved = await saveDraft(payload);
      if (submit) {
        // Nunca marcar PENDING_APPROVAL no cliente; transição é responsabilidade do backend.
        await requestActionsApi.submit(saved.id, saved.lockVersion);
      }
      router.push(`/dashboard/requests/${saved.id}`);
      router.refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a solicitação.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persist(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/requests" className="mb-4 inline-flex items-center gap-2 text-sm text-[#004289] hover:underline">
          <ArrowLeft className="size-4" /> Minhas solicitações
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Nova solicitação</h1>
        <p className="mt-1 text-sm text-slate-500">Preencha os dados para solicitar uma compra.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={saving || !allowed} className="space-y-6">
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b px-5 py-4"><h2 className="font-semibold text-slate-900">Dados da solicitação</h2></div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="title" className={labelClass}>Título da solicitação *</label>
                <input id="title" className={fieldClass} required maxLength={255} placeholder="Ex.: Aquisição de notebooks" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label htmlFor="category" className={labelClass}>Categoria *</label>
                <select id="category" className={fieldClass} required value={category} onChange={(e) => setCategory(e.target.value as RequestCategory | "")}>
                  <option value="">Selecione uma categoria</option>
                  {requestCategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="neededBy" className={labelClass}>Data de necessidade</label>
                <input id="neededBy" type="date" className={fieldClass} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className={labelClass}>Justificativa / descrição *</label>
                <textarea id="description" rows={4} required className={`${fieldClass} h-auto min-h-28 py-3`} placeholder="Descreva a finalidade desta compra..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <p className={labelClass}>Centro de custo</p>
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">Vinculado à conta autenticada</div>
                <p className="mt-1 text-xs text-slate-500">O backend deve validar o centro de custo permitido para o solicitante.</p>
              </div>
            </div>
            {category === "SOFTWARE" && <p className="border-t bg-slate-50 px-5 py-3 text-sm text-[#004289]">Solicitações de software exigem aprovação final do ADMIN.</p>}
          </section>

          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div><h2 className="font-semibold text-slate-900">Itens da solicitação</h2><p className="mt-1 text-xs text-slate-500">Informe os produtos ou serviços desejados.</p></div>
              <button type="button" onClick={() => setItems((list) => [...list, emptyItem(nextId.current++)])} className="inline-flex h-9 items-center gap-2 rounded bg-[#004289] px-3 text-sm font-medium text-white"><Plus className="size-4" /> Adicionar item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-sm">
                <thead className="bg-[#004289] text-white"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Quantidade</th><th className="px-4 py-3">Valor unitário</th><th className="px-4 py-3">Subtotal</th><th className="px-4 py-3">Ação</th></tr></thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.localId} className={`border-b ${index % 2 ? "bg-[#F5F7FA]" : "bg-white"}`}>
                      <td className="px-4 py-4">{index + 1}</td>
                      <td className="px-4 py-4"><input aria-label={`Descrição do item ${index + 1}`} required className={fieldClass} value={item.description} onChange={(e) => editItem(item.localId, "description", e.target.value)} /></td>
                      <td className="px-4 py-4"><input aria-label={`Quantidade do item ${index + 1}`} type="number" min="1" step="1" required className={fieldClass} value={item.quantity} onChange={(e) => editItem(item.localId, "quantity", e.target.value)} /></td>
                      <td className="px-4 py-4"><input aria-label={`Preço do item ${index + 1}`} type="number" min="0.01" step="0.01" required className={fieldClass} value={item.unitPrice} onChange={(e) => editItem(item.localId, "unitPrice", e.target.value)} /></td>
                      <td className="px-4 py-4 font-medium">{brl.format(Math.max(0, numeric(item.quantity) * numeric(item.unitPrice) || 0))}</td>
                      <td className="px-4 py-4"><button type="button" disabled={items.length === 1} onClick={() => setItems((list) => list.filter((row) => row.localId !== item.localId))} aria-label={`Remover item ${index + 1}`} className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 className="size-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-slate-50 px-5 py-4 text-right"><p className="text-sm text-slate-600">Valor total da solicitação</p><p className="text-2xl font-semibold text-[#004289]">{brl.format(total)}</p></div>
          </section>
        </fieldset>

        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!allowed && <p role="alert" className="text-sm text-amber-700">Você precisa estar autenticado como SOLICITANTE.</p>}

        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          <Link href="/dashboard/requests" className="inline-flex h-10 items-center rounded border border-slate-300 px-5 text-sm text-slate-700">Voltar</Link>
          <button type="button" disabled={saving || !allowed} onClick={() => void persist(false)} className="inline-flex h-10 items-center gap-2 rounded border border-[#004289] px-4 text-sm font-medium text-[#004289] disabled:opacity-50"><Save className="size-4" /> Salvar rascunho</button>
          <button type="submit" disabled={saving || !allowed} className="inline-flex h-10 items-center gap-2 rounded bg-[#004289] px-4 text-sm font-medium text-white disabled:opacity-50"><Send className="size-4" /> {saving ? "Salvando..." : "Enviar para aprovação"}</button>
        </div>
      </form>
    </div>
  );
}
