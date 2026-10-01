import type { OrderRecord } from "./orders";

// Só usado em dev local quando não há BLOB_READ_WRITE_TOKEN configurado (ou
// seja, nunca em produção — lá a variável sempre existe). Sem isso, abrir o
// admin localmente cai em erro de conexão com o Blob e a lista de pedidos
// nunca aparece, o que inviabiliza testar o layout sem mexer em dados reais.
export function isDevFallbackActive() {
  return process.env.NODE_ENV !== "production" && !process.env.BLOB_READ_WRITE_TOKEN;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const EMPTY_ADDRESS = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const CAMPO_GRANDE_ADDRESS = {
  cep: "79000000",
  street: "Rua das Aquarelas",
  number: "123",
  complement: "",
  neighborhood: "Centro",
  city: "Campo Grande",
  state: "MS",
};

export const DEV_FALLBACK_ORDERS: OrderRecord[] = [
  {
    id: "dev-1",
    createdAt: daysAgo(15),
    status: "paid",
    name: "Letícia Luna",
    email: "leticia@example.com",
    phone: "67998502006",
    cpf: "111.444.777-35",
    items: [
      { paperSize: "A5", theme: "outro", description: "Casal com o cachorro", referenceFiles: [], quantity: 2, unitPriceCents: 16000 },
    ],
    shippingAddress: CAMPO_GRANDE_ADDRESS,
    shippingCents: 0,
    totalPriceCents: 32000,
    paymentMethod: "pix",
    installments: 1,
    paidAt: daysAgo(15),
    rushDays: 10,
    rushCents: 8000,
  },
  {
    id: "dev-2",
    createdAt: daysAgo(20),
    status: "shipped",
    name: "Maria Isabel Carrijo Ramos Bittar",
    email: "maria@example.com",
    phone: "16999861454",
    cpf: "222.333.444-55",
    items: [{ paperSize: "A5", theme: "casal", description: "Casamento na praia", referenceFiles: [], quantity: 1, unitPriceCents: 21000 }],
    shippingAddress: CAMPO_GRANDE_ADDRESS,
    shippingCents: 0,
    totalPriceCents: 24500,
    paymentMethod: "pix",
    installments: 1,
    paidAt: daysAgo(18),
    rushDays: 10,
    rushCents: 3000,
  },
  {
    id: "dev-3",
    createdAt: daysAgo(1),
    status: "pix_pending",
    name: "João Pedro",
    email: "joao@example.com",
    phone: "67999990000",
    cpf: "333.444.555-66",
    items: [{ paperSize: "A4", theme: "pet", description: "Meu gato Felix", referenceFiles: [], quantity: 1, unitPriceCents: 21000 }],
    shippingAddress: EMPTY_ADDRESS,
    shippingCents: 2500,
    totalPriceCents: 23500,
    rushDays: 5,
    rushCents: 16000,
  },
  {
    id: "dev-4",
    createdAt: daysAgo(2),
    status: "pending_quote",
    name: "Ana Paula",
    email: "ana@example.com",
    phone: "67999990001",
    cpf: "444.555.666-77",
    items: [{ paperSize: "personalizado", theme: "homenagem", description: "Quadro grande em homenagem ao meu avô", referenceFiles: [], quantity: 1, unitPriceCents: null }],
    shippingAddress: EMPTY_ADDRESS,
    shippingCents: 0,
    totalPriceCents: null,
    rushDays: null,
    rushCents: 0,
  },
  {
    id: "dev-5",
    createdAt: daysAgo(3),
    status: "cancelled",
    name: "Carlos Souza",
    email: "carlos@example.com",
    phone: "67999990002",
    cpf: "555.666.777-88",
    items: [{ paperSize: "A5", theme: "retrato", description: "Retrato próprio", referenceFiles: [], quantity: 1, unitPriceCents: 18000 }],
    shippingAddress: EMPTY_ADDRESS,
    shippingCents: 2500,
    totalPriceCents: 20500,
    rushDays: null,
    rushCents: 0,
  },
  {
    id: "dev-6",
    createdAt: daysAgo(1),
    status: "paid",
    name: "Fernanda Lima",
    email: "fernanda@example.com",
    phone: "67999990003",
    cpf: "666.777.888-99",
    items: [{ paperSize: "A4", theme: "santo", description: "Nossa Senhora Aparecida", referenceFiles: [], quantity: 1, unitPriceCents: 21000 }],
    shippingAddress: CAMPO_GRANDE_ADDRESS,
    shippingCents: 0,
    totalPriceCents: 21000,
    couponCode: "ATELIE10",
    discountCents: 2100,
    paymentMethod: "credit_card",
    installments: 3,
    paidAt: daysAgo(1),
    rushDays: null,
    rushCents: 0,
  },
];
