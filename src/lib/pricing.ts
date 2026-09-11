export type PaperSize = "A5" | "A4" | "personalizado";

export const PAPER_SIZES: Record<
  PaperSize,
  { label: string; dimensions: string; priceCents: number | null; description: string }
> = {
  A5: {
    label: "A5",
    dimensions: "14,8 x 21 cm",
    priceCents: 18000,
    description: "Ideal para desenhos delicados e versáteis, ótima opção para presentes e retratos.",
  },
  A4: {
    label: "A4",
    dimensions: "21 x 29,7 cm",
    priceCents: 21000,
    description: "Ideal para desenhos com riquezas de detalhes, ótima opção para quadros e decoração.",
  },
  personalizado: {
    label: "Personalizado",
    dimensions: "Tamanho a combinar",
    priceCents: null,
    description: "Quer outro tamanho, formato ou um quadro maior? Conte o que imagina e enviamos um orçamento antes de qualquer cobrança.",
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
  { value: "20d", label: "Em até 20 dias", days: 20, priceCents: 1500 },
  { value: "15d", label: "Em até 15 dias", days: 15, priceCents: 2000 },
  { value: "10d", label: "Em até 10 dias", days: 10, priceCents: 4000 },
  { value: "5d", label: "Em até 5 dias", days: 5, priceCents: 8000 },
];

export function getRushOption(value: string) {
  return RUSH_OPTIONS.find((o) => o.value === value) ?? RUSH_OPTIONS[0];
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
