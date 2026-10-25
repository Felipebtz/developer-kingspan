"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Eye, Check, X, MessageSquareWarning, RefreshCw, Search } from "lucide-react";
import {
  approvalsApi,
  isActionAllowed,
  type ApprovalAction,
  type ApprovalRequest,
} from "@/lib/api/approvals";
import type { AuthState } from "@/lib/redux/auth/authSlice";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const categories: Record<string, string> = {
  EQUIPMENT: "Equipamentos", SERVICES: "Serviços", SUPPLIES: "Materiais",
  TRAVEL: "Viagens", SOFTWARE: "Software", OTHER: "Outros",
};
const actionNames: Record<ApprovalAction, string> = {
  APPROVE: "Aprovar", REJECT: "Rejeitar", REQUEST_CHANGES: "Solicitar alterações",
};

export default function ApprovalsPage() {
  const auth = useSelector((state: { auth: AuthState }) => state.auth);
  const canView = auth.user?.role === "ADMIN" || auth.user?.role === "APROVADOR";
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<ApprovalAction | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!canView) {
      setRequests([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    approvalsApi.list(page, 50)
      .then((response) => {
        if (!active) return;
        setRequests(response.data.filter((request) => request.status === "PENDING_APPROVAL"));
        setTotalPages(Math.max(1, response.totalPages || 1));
      })
      .catch((err: unknown) => {
        if (active) {
          setRequests([]);
          setError(err instanceof Error ? err.message : "Erro ao carregar aprovações.");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canView, page, reload, auth.accessToken]);

  async function openDecision(id: number, action: ApprovalAction) {
    if (processing) return;
    setProcessing(true);
    setError("");
    setMessage("");
    try {
      // Busca a versão mais recente antes de iniciar a decisão.
      const current = await approvalsApi.detail(id);
      if (current.status !== "PENDING_APPROVAL") {
        throw new Error("Essa solicitação não está mais pendente de aprovação.");
      }
      if (!isActionAllowed(current, action)) {
        throw new Error("Essa decisão não está autorizada para seu usuário ou etapa atual.");
      }
      setSelected(current);
      setDecision(action);
      setComment("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a solicitação.");
      setReload((v) => v + 1);
    } finally {
      setProcessing(false);
    }
  }

  async function confirmDecision() {
    if (!selected || !decision || processing) return;
    if (decision !== "APPROVE" && !comment.trim()) {
      setError("Informe a justificativa para esta decisão.");
      return;
    }
    setProcessing(true);
    setError("");
    setMessage("");
    try {
      // Revalida lockVersion e ações antes do POST, evitando usar dados antigos.
      const current = await approvalsApi.detail(selected.id);
      if (current.status !== "PENDING_APPROVAL" || !isActionAllowed(current, decision)) {
        throw new Error("A solicitação ou a etapa de aprovação mudou. Atualize a lista.");
      }
      await approvalsApi.decide(current.id, decision, current.lockVersion, comment.trim());
      const actionDone = decision;
      setSelected(null);
      setDecision(null);
      setComment("");
      setMessage(`${actionNames[actionDone]}: decisão registrada no servidor.`);
      setReload((v) => v + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a decisão.");
    } finally {
      setProcessing(false);
    }
  }

  const visible = requests.filter((request) => {
    const term = search.trim().toLowerCase();
    return `${request.id} ${request.title} ${request.category ?? ""}`.toLowerCase().includes(term);
  });

  if (!canView) {
    return <div className="rounded border bg-white p-6 text-sm text-slate-700">Acesso restrito a aprovadores e administradores.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Aprovações</h1>
          <p className="mt-1 text-sm text-slate-500">Solicitações pendentes e decisões autorizadas pelo backend.</p>
        </div>
        <button type="button" onClick={() => setReload((v) => v + 1)} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"><RefreshCw className="size-4" /> Atualizar</button>
      </div>
      <section className="rounded border border-slate-200 bg-white px-5 py-4 text-sm">
        <p className="font-medium text-slate-900">{auth.user?.name ?? "Usuário autenticado"}</p>
        <p className="mt-1 text-xs text-slate-500">Perfil: {auth.user?.role ?? "—"}</p>
      </section>
      {message && <p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="overflow-hidden rounded border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Solicitações pendentes</h2>
            <p className="mt-1 text-xs text-slate-500">Ações disponíveis conforme a etapa real de aprovação.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nesta página" className="h-10 rounded border border-slate-300 pl-9 pr-3 text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#004289] text-white"><tr>
              { ["Solicitação", "Categoria", "Data", "Valor", "Status", "Ações"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>) }
            </tr></thead>
            <tbody>
              {!loading && visible.map((request, index) => (
                <tr key={request.id} className={`border-b border-slate-200 ${index % 2 ? "bg-[#F5F7FA]" : "bg-white"}`}>
                  <td className="px-4 py-4"><p className="font-medium">{request.title}</p><p className="text-xs text-slate-500">#{request.id}</p></td>
                  <td className="px-4 py-4">{request.category ? categories[request.category] ?? request.category : "—"}</td>
                  <td className="px-4 py-4">{request.createdAt ? new Date(request.createdAt).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="px-4 py-4 font-medium">{currency.format(request.totalAmount)}</td>
                  <td className="px-4 py-4 text-[#A16207]">Em aprovação</td>
                  <td className="px-4 py-4"><div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/requests/${request.id}`} className="inline-flex items-center gap-1 rounded bg-[#004289] px-3 py-2 text-xs text-white"><Eye className="size-3.5" /> Visualizar</Link>
                    {isActionAllowed(request, "APPROVE") && <button type="button" disabled={processing} onClick={() => openDecision(request.id, "APPROVE")} className="inline-flex items-center gap-1 rounded border border-[#004289] px-3 py-2 text-xs text-[#004289] disabled:opacity-40"><Check className="size-3.5" /> Aprovar</button>}
                    {isActionAllowed(request, "REJECT") && <button type="button" disabled={processing} onClick={() => openDecision(request.id, "REJECT")} className="inline-flex items-center gap-1 rounded border border-red-600 px-3 py-2 text-xs text-red-600 disabled:opacity-40"><X className="size-3.5" /> Rejeitar</button>}
                    {isActionAllowed(request, "REQUEST_CHANGES") && <button type="button" disabled={processing} onClick={() => openDecision(request.id, "REQUEST_CHANGES")} className="inline-flex items-center gap-1 rounded border px-3 py-2 text-xs disabled:opacity-40"><MessageSquareWarning className="size-3.5" /> Pedir alterações</button>}
                  </div></td>
                </tr>
              ))}
              {loading && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando solicitações...</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma solicitação pendente encontrada nesta página.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t p-4 text-sm text-slate-500">
          <span>Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={loading || page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded border px-3 py-2 disabled:opacity-40">Anterior</button>
            <button type="button" disabled={loading || page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </section>
      {selected && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="decision-dialog" className="w-full max-w-md rounded bg-white p-6 shadow-xl">
            <h2 id="decision-dialog" className="text-lg font-semibold">{actionNames[decision]} solicitação</h2>
            <p className="mt-2 text-sm text-slate-600">#{selected.id} — {selected.title}</p>
            <p className="mt-1 text-sm text-slate-600">Total: {currency.format(selected.totalAmount)}</p>
            <label htmlFor="decision-comment" className="mt-5 block text-sm font-medium">Comentário {decision === "APPROVE" ? "(opcional)" : "*"}</label>
            <textarea id="decision-comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-2 w-full rounded border border-slate-300 p-3 text-sm" placeholder="Justificativa da decisão" />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={processing} onClick={() => { setSelected(null); setDecision(null); setError(""); }} className="rounded border px-4 py-2 text-sm">Cancelar</button>
              <button type="button" disabled={processing || (decision !== "APPROVE" && !comment.trim())} onClick={confirmDecision} className="rounded bg-[#004289] px-4 py-2 text-sm text-white disabled:opacity-40">{processing ? "Processando..." : "Confirmar decisão"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
