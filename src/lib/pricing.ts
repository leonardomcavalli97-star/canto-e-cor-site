export type PaperSize = "A5" | "A4" | "personalizado";

export const PAPER_SIZES: Record<
  PaperSize,
  { label: string; dimensions: string; priceCents: number | null; description: string }
> = {
  A5: {
    label: "A5",
    dimensions: "14,8 x 21 cm",
    priceCents: 15000,
    description: "Ideal para desenhos delicados e versáteis, ótima opção para presentes e retratos.",
  },
  A4: {
    label: "A4",
    dimensions: "21 x 29,7 cm",
    priceCents: 18000,
    description: "Ideal para desenhos com riquezas de detalhes, ótima opção para quadros e decoração.",
  },
  personalizado: {
    label: "Personalizado",
    dimensions: "Tamanho a combinar",
    priceCents: null,
    description: "Quer outro tamanho, formato ou um quadro maior? Conte o que imagina e enviamos um orçamento antes de qualquer cobrança.",
  },
};

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatPrice(cents: number | null) {
  return cents === null ? "Valor a combinar" : formatBRL(cents);
}
