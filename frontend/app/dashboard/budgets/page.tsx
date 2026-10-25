
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import { Plus, RefreshCw, Pencil } from "lucide-react";

import {
  administrationApi,
  type MonthlyBudget,
  type CostCenter,
} from "@/lib/api/administration";

import type { AuthState } from "@/lib/redux/auth/authSlice";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function parseAmount(value: string): number | null {
  if (!/^\d{1,16}(\.\d{1,2})?$/.test(value.trim())) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export default function BudgetsPage() {
  const auth = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const isAdmin = auth.user?.role === "ADMIN";

  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  const [costCenterId, setCostCenterId] = useState("");
  const [competence, setCompetence] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setBudgets([]);
      setCenters([]);
      return;
    }

    let active = true;

    Promise.all([
      administrationApi.listBudgets(),
      administrationApi.listCostCenters(),
    ])
      .then(([budgetData, centerData]) => {
        if (!active) return;

        setBudgets(budgetData);
        setCenters(centerData);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar os orçamentos."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, reload]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const amount = parseAmount(allocatedAmount);

    if (!costCenterId || !competence || amount === null) {
      setError("Informe centro de custo, competência e valor válido.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const created = await administrationApi.createBudget({
        costCenterId: Number(costCenterId),
        competence,
        allocatedAmount: amount,
      });

      setBudgets((current) => [created, ...current]);
      setCostCenterId("");
      setCompetence("");
      setAllocatedAmount("");

      setMessage("Orçamento mensal cadastrado com sucesso.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o orçamento."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(budget: MonthlyBudget) {
    setEditingId(budget.id);
    setEditingAmount(String(budget.allocatedAmount));
    setError("");
    setMessage("");
  }

  async function handleUpdate(id: number) {
    if (saving) return;

    const amount = parseAmount(editingAmount);

    if (amount === null) {
      setError("Informe um valor válido com até duas casas decimais.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await administrationApi.updateBudget(id, {
        allocatedAmount: amount,
      });

      setBudgets((current) =>
        current.map((budget) =>
          budget.id === id ? updated : budget
        )
      );

      setEditingId(null);
      setEditingAmount("");

      setMessage("Alocação atualizada com sucesso.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o orçamento."
      );
    } finally {
      setSaving(false);
    }
  }

  if (auth.status === "pending" && !auth.user) {
    return <p className="p-6 text-slate-500">Validando sessão...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-md border bg-white p-6">
        <h1 className="text-xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-600">
          Apenas administradores podem gerenciar orçamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Orçamentos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestão do orçamento mensal por centro de custo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            setReload((value) => value + 1);
          }}
          className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm"
        >
          <RefreshCw className="size-4" />
          Atualizar
        </button>
      </div>

      {/* CADASTRO */}
      <form
        onSubmit={handleCreate}
        className="rounded-md border border-slate-200 bg-white p-5"
      >
        <div className="mb-5 flex items-center gap-2">
          <Plus className="size-5 text-[#004289]" />
          <h2 className="font-semibold text-slate-900">
            Cadastrar orçamento mensal
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="budget-center" className="mb-2 block text-sm">
              Centro de custo *
            </label>

            <select
              id="budget-center"
              required
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              className="h-10 w-full rounded border border-slate-300 px-3"
            >
              <option value="">Selecione</option>

              {centers
                .filter((center) => center.status === "ACTIVE")
                .map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.code} — {center.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget-month" className="mb-2 block text-sm">
              Competência *
            </label>

            <input
              id="budget-month"
              type="month"
              required
              value={competence}
              onChange={(e) => setCompetence(e.target.value)}
              className="h-10 w-full rounded border border-slate-300 px-3"
            />
          </div>

          <div>
            <label htmlFor="budget-amount" className="mb-2 block text-sm">
              Valor alocado (R$) *
            </label>

            <input
              id="budget-amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
              placeholder="50000.00"
              className="h-10 w-full rounded border border-slate-300 px-3"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="mt-5 rounded bg-[#004289] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Cadastrar orçamento"}
        </button>
      </form>

      {/* MENSAGENS */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}

      {/* LISTAGEM */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold text-slate-900">
            Orçamentos cadastrados
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            O consumo é atualizado na aprovação final pelo ADMIN.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-4 py-3">Centro de custo</th>
                <th className="px-4 py-3">Competência</th>
                <th className="px-4 py-3">Alocado</th>
                <th className="px-4 py-3">Consumido</th>
                <th className="px-4 py-3">Disponível</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                budgets.map((budget) => (
                  <tr key={budget.id} className="border-b">
                    <td className="px-4 py-4">
                      {budget.costCenterName}
                    </td>

                    <td className="px-4 py-4">
                      {budget.competence}
                    </td>

                    <td className="px-4 py-4">
                      {currency.format(budget.allocatedAmount)}
                    </td>

                    <td className="px-4 py-4">
                      {currency.format(budget.consumedAmount)}
                    </td>

                    <td className="px-4 py-4 font-semibold text-[#004289]">
                      {currency.format(budget.availableAmount)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {editingId === budget.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingAmount}
                            onChange={(e) =>
                              setEditingAmount(e.target.value)
                            }
                            className="h-9 w-32 rounded border px-2"
                            aria-label="Novo valor alocado"
                          />

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleUpdate(budget.id)}
                            className="rounded bg-[#004289] px-3 py-2 text-xs text-white disabled:opacity-50"
                          >
                            Salvar
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setEditingId(null)}
                            className="rounded border px-3 py-2 text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(budget)}
                          className="inline-flex items-center gap-2 rounded border border-[#004289] px-3 py-2 text-xs text-[#004289]"
                        >
                          <Pencil className="size-3.5" />
                          Alterar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    Carregando orçamentos...
                  </td>
                </tr>
              )}

              {!loading && !error && budgets.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500"
                  >
                    Nenhum orçamento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
