
"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const costCenters = [
  { id: 1, code: "CC-001", name: "Administrativo", status: "ACTIVE" },
  { id: 2, code: "CC-002", name: "Tecnologia", status: "ACTIVE" },
  { id: 3, code: "CC-003", name: "Produção", status: "ACTIVE" },
  { id: 4, code: "CC-004", name: "Manutenção", status: "ACTIVE" },
  { id: 5, code: "CC-005", name: "Logística", status: "INACTIVE" },
];

export default function CostCentersPage() {
  const [search, setSearch] = useState("");

  const filtered = costCenters.filter((center) =>
    `${center.code} ${center.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Centros de custo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulte os centros de custo da organização.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold">Centros cadastrados</h2>
          <p className="mt-1 text-xs text-slate-500">
            Dados demonstrativos
          </p>

          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar código ou nome"
              className="h-10 w-full rounded border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#004289]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead className="bg-[#004289] text-white">
              <tr>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((center, index) => (
                <tr
                  key={center.id}
                  className={`border-b border-slate-200 ${
                    index % 2 ? "bg-[#F5F7FA]" : "bg-white"
                  }`}
                >
                  <td className="px-5 py-4">{center.code}</td>
                  <td className="px-5 py-4">{center.name}</td>
                  <td className={`px-5 py-4 font-semibold ${
                    center.status === "ACTIVE"
                      ? "text-[#004289]"
                      : "text-[#DC2626]"
                  }`}>
                    {center.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Nenhum centro de custo encontrado.
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
