export type RequestStatus =
  | "DRAFT"
  | "IN_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type RequestItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type PurchaseRequest = {
  id: number;
  title: string;
  description: string;
  category: string;
  neededBy: string;
  date: string;
  amount: number;
  status: RequestStatus;
  items: RequestItem[];
};

const STORAGE_KEY = "kingspan-demo-requests";

export const categories = [
  { value: "EQUIPAMENTOS", label: "Equipamentos" },
  { value: "MATERIAIS", label: "Materiais" },
  { value: "SOFTWARE", label: "Software" },
  { value: "SERVICOS", label: "Serviços" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "OUTROS", label: "Outros" },
];

export const statusConfig: Record<
  RequestStatus,
  { label: string; color: string }
> = {
  DRAFT: {
    label: "Rascunho",
    color: "text-[#111827]",
  },
  IN_APPROVAL: {
    label: "Em aprovação",
    color: "text-[#A16207]",
  },
  APPROVED: {
    label: "Aprovada",
    color: "text-[#004289]",
  },
  REJECTED: {
    label: "Rejeitada",
    color: "text-[#DC2626]",
  },
};

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function categoryLabel(value: string) {
  return categories.find((c) => c.value === value)?.label ?? value;
}

export function itemNumber(value: string) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export function calculateTotal(items: RequestItem[]) {
  return items.reduce(
    (total, item) =>
      total +
      itemNumber(item.quantity) * itemNumber(item.unitPrice),
    0
  );
}

export const exampleRequests: PurchaseRequest[] = [
  {
    id: 1042,
    title: "Computadores para equipe",
    description: "Aquisição de computadores para a equipe.",
    category: "EQUIPAMENTOS",
    neededBy: "",
    date: "24/10/2026",
    amount: 6800,
    status: "IN_APPROVAL",
    items: [
      {
        id: 1,
        description: "Computadores",
        quantity: "2",
        unitPrice: "3400",
      },
    ],
  },
  {
    id: 1041,
    title: "Licenças de software",
    description: "Renovação de licenças.",
    category: "SOFTWARE",
    neededBy: "",
    date: "23/10/2026",
    amount: 2450,
    status: "IN_APPROVAL",
    items: [
      {
        id: 1,
        description: "Licença de software",
        quantity: "1",
        unitPrice: "2450",
      },
    ],
  },
  {
    id: 1040,
    title: "Materiais de manutenção",
    description: "Materiais necessários para manutenção.",
    category: "MANUTENCAO",
    neededBy: "",
    date: "22/10/2026",
    amount: 980,
    status: "DRAFT",
    items: [
      {
        id: 1,
        description: "Materiais de manutenção",
        quantity: "1",
        unitPrice: "980",
      },
    ],
  },
  {
    id: 1039,
    title: "Serviço de calibração",
    description: "Serviço de calibração.",
    category: "SERVICOS",
    neededBy: "",
    date: "20/10/2026",
    amount: 1400,
    status: "APPROVED",
    items: [
      {
        id: 1,
        description: "Serviço de calibração",
        quantity: "1",
        unitPrice: "1400",
      },
    ],
  },
  {
    id: 1038,
    title: "Materiais de escritório",
    description: "Aquisição de materiais de escritório.",
    category: "MATERIAIS",
    neededBy: "",
    date: "18/10/2026",
    amount: 720,
    status: "REJECTED",
    items: [
      {
        id: 1,
        description: "Materiais de escritório",
        quantity: "1",
        unitPrice: "720",
      },
    ],
  },
];

function readStoredRequests(): PurchaseRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is PurchaseRequest =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        typeof item.title === "string" &&
        Array.isArray(item.items) &&
        ["DRAFT", "IN_APPROVAL", "APPROVED", "REJECTED"]
          .includes(item.status)
    );
  } catch {
    return [];
  }
}

export function getAllRequests(): PurchaseRequest[] {
  const map = new Map<number, PurchaseRequest>();

  exampleRequests.forEach((item) => map.set(item.id, item));
  readStoredRequests().forEach((item) => map.set(item.id, item));

  return Array.from(map.values()).sort((a, b) => b.id - a.id);
}

export function getRequest(id: number) {
  return getAllRequests().find((item) => item.id === id);
}

export function saveRequest(request: PurchaseRequest) {
  const stored = readStoredRequests().filter(
    (item) => item.id !== request.id
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...stored, request])
  );
}
