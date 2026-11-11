export type PaperSize = "A5" | "A4" | "flashcard" | "personalizado";

export const PAPER_SIZES: Record<
  PaperSize,
  { label: string; dimensions: string; priceCents: number | null; description: string }
> = {
  A5: {
    label: "A5",
    dimensions: "14,8 × 21 cm",
    priceCents: 18000,
    description: "Para desenhos delicados, ótimo para presentes e retratos.",
  },
  A4: {
    label: "A4",
    dimensions: "21 × 29,7 cm",
    priceCents: 21000,
    description: "Para desenhos ricos em detalhes, ótimo para quadros e decoração.",
  },
  // A descrição do Flashcards também é o aviso de que o formato só comporta
  // desenhos simples — não remover o "poucos detalhes".
  flashcard: {
    label: "Flashcards",
    dimensions: "10,5 × 14,5 cm",
    priceCents: 3500,
    description: "Para pinturas divertidas, com referências simples e poucos detalhes.",
  },
  personalizado: {
    label: "Personalizado",
    dimensions: "Tamanho sob medida",
    priceCents: null,
    description: "Outro tamanho ou formato? Enviamos um orçamento antes de cobrar.",
  },
};

export const THEME_OPTIONS: { value: string; label: string }[] = [
  { value: "casal", label: "Casal" },
  { value: "pet", label: "Pet" },
  { value: "retrato", label: "Retrato" },
  { value: "santo", label: "Santo / Devocional" },
  { value: "homenagem", label: "Homenagem" },
  { value: "outro", label: "Outro" },
];

export const THEME_LABELS: Record<string, string> = Object.fromEntries(
  THEME_OPTIONS.map((t) => [t.value, t.label])
);

export type RushValue = "standard" | "20d" | "15d" | "10d" | "5d";

export const RUSH_OPTIONS: { value: RushValue; label: string; days: number | null; priceCents: number }[] = [
  { value: "standard", label: "Sem urgência", days: null, priceCents: 0 },
  { value: "20d", label: "Em até 20 dias", days: 20, priceCents: 3000 },
  { value: "15d", label: "Em até 15 dias", days: 15, priceCents: 4000 },
  { value: "10d", label: "Em até 10 dias", days: 10, priceCents: 8000 },
  { value: "5d", label: "Em até 5 dias", days: 5, priceCents: 16000 },
];

export function getRushOption(value: string) {
  return RUSH_OPTIONS.find((o) => o.value === value) ?? RUSH_OPTIONS[0];
}

// A taxa de prazo expresso é por peça: um pedido com N peças no mesmo
// prazo custa N vezes a taxa de uma peça só, porque cada peça extra
// exige o mesmo trabalho sob o mesmo aperto de tempo.
export function multiplyRushCents(priceCentsPerPiece: number, totalPieceCount: number) {
  return priceCentsPerPiece * Math.max(1, totalPieceCount);
}

export const SHIPPING_FLAT_CENTS = 2500;
const FREE_SHIPPING_CITY = "campo grande";
const FREE_SHIPPING_STATE = "ms";

export function isFreeShippingAddress(city: string, state: string) {
  return (
    city.trim().toLowerCase() === FREE_SHIPPING_CITY &&
    state.trim().toLowerCase() === FREE_SHIPPING_STATE
  );
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatPrice(cents: number | null) {
  return cents === null ? "Valor a combinar" : formatBRL(cents);
}

// Rótulo usado só no checkout para itens sem preço fixo. O resto do sistema
// (admin, e-mails, acompanhamento) continua usando formatPrice.
export function formatPriceOrQuote(cents: number | null) {
  return cents === null ? "Sob orçamento" : formatBRL(cents);
}

export const MAX_INSTALLMENTS = 3;
