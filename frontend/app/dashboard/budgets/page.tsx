
const budgets = [
  { id: 1, center: "Administrativo", month: "10/2026", allocated: 50000, consumed: 18500 },
  { id: 2, center: "Tecnologia", month: "10/2026", allocated: 80000, consumed: 42500 },
  { id: 3, center: "Produção", month: "10/2026", allocated: 150000, consumed: 112000 },
  { id: 4, center: "Manutenção", month: "10/2026", allocated: 60000, consumed: 28000 },
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function BudgetsPage() {
  const allocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const consumed = budgets.reduce((sum, b) => sum + b.consumed, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Orçamentos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhamento mensal por centro de custo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Orçamento alocado", value: allocated },
          { label: "Valor consumido", value: consumed },
          { label: "Saldo disponível", value: allocated - consumed },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-600">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#004289]">
              {currency.format(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold">Orçamento por centro de custo</h2>
          <p className="mt-1 text-xs text-slate-500">Dados demonstrativos</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-5 py-3">Centro de custo</th>
                <th className="px-5 py-3">Competência</th>
                <th className="px-5 py-3">Alocado</th>
                <th className="px-5 py-3">Consumido</th>
                <th className="px-5 py-3">Disponível</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b, index) => (
                <tr
                  key={b.id}
                  className={`border-b border-slate-200 ${
                    index % 2 ? "bg-[#F5F7FA]" : "bg-white"
                  }`}
                >
                  <td className="px-5 py-4 font-medium">{b.center}</td>
                  <td className="px-5 py-4">{b.month}</td>
                  <td className="px-5 py-4">{currency.format(b.allocated)}</td>
                  <td className="px-5 py-4">{currency.format(b.consumed)}</td>
                  <td className="px-5 py-4 font-semibold text-[#004289]">
                    {currency.format(b.allocated - b.consumed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
