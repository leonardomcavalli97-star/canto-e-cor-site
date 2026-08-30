"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PAPER_SIZES, formatPrice, type PaperSize } from "@/lib/pricing";
import { Button } from "@/components/Button";
import {
  CreditCard,
  Image as ImageIcon,
  Lock,
  Mail,
  Minus,
  Paintbrush,
  Plus,
  QrCode,
  X,
} from "lucide-react";

const THEMES: { value: string; label: string }[] = [
  { value: "casal", label: "Casal" },
  { value: "pet", label: "Pet" },
  { value: "retrato", label: "Retrato" },
  { value: "santo", label: "Santo / Devocional" },
  { value: "homenagem", label: "Homenagem" },
  { value: "outro", label: "Outro" },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_QUANTITY = 10;

type CartItem = {
  paperSize: PaperSize;
  theme: string;
  themeOther: string;
  customSize: string;
  quantity: number;
  files: File[];
  description: string;
};

function itemUnitPrice(item: Pick<CartItem, "paperSize">) {
  return PAPER_SIZES[item.paperSize].priceCents;
}

function itemFinalDescription(item: CartItem) {
  let desc = item.description;
  if (item.paperSize === "personalizado" && item.customSize.trim()) {
    desc = `Tamanho desejado: ${item.customSize.trim()}\n\n${desc}`;
  }
  if (item.theme === "outro" && item.themeOther.trim()) {
    desc = `Tema: ${item.themeOther.trim()}\n\n${desc}`;
  }
  return desc;
}

export default function OrderForm() {
  const router = useRouter();

  // Campos do desenho que está sendo configurado agora.
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [theme, setTheme] = useState("casal");
  const [themeOther, setThemeOther] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Desenhos já adicionados ao pedido.
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [readyToChoosePayment, setReadyToChoosePayment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const cartPreviews = useMemo(
    () => cartItems.map((item) => (item.files[0] ? URL.createObjectURL(item.files[0]) : null)),
    [cartItems]
  );

  useEffect(() => {
    return () => cartPreviews.forEach((url) => url && URL.revokeObjectURL(url));
  }, [cartPreviews]);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return;
    setFileError(null);
    const incoming = Array.from(newFiles);
    const combined = [...files, ...incoming];

    if (combined.length > MAX_FILES) {
      setFileError(`Você pode enviar no máximo ${MAX_FILES} fotos por desenho.`);
      return;
    }
    for (const f of incoming) {
      if (!f.type.startsWith("image/")) {
        setFileError(`"${f.name}" não é uma imagem.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`"${f.name}" passa de 10MB.`);
        return;
      }
    }
    setFiles(combined);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function resetCurrentItem() {
    setPaperSize("A4");
    setTheme("casal");
    setThemeOther("");
    setCustomSize("");
    setQuantity(1);
    setDescription("");
    setFiles([]);
    setFileError(null);
  }

  function currentItemHasContent() {
    return files.length > 0 || description.trim().length > 0;
  }

  function validateCurrentItem(): string | null {
    if (files.length === 0) return "Envie ao menos uma foto de referência.";
    if (!description.trim()) return "Descreva o que você imagina para esse desenho.";
    if (paperSize === "personalizado" && !customSize.trim()) return "Conte que tamanho você imagina.";
    if (theme === "outro" && !themeOther.trim()) return "Conte qual é o tema.";
    return null;
  }

  function currentItemSnapshot(): CartItem {
    return { paperSize, theme, themeOther, customSize, quantity, files, description };
  }

  function handleAddAnother() {
    const error = validateCurrentItem();
    if (error) {
      setFileError(error);
      return;
    }
    setCartItems((prev) => [...prev, currentItemSnapshot()]);
    resetCurrentItem();
  }

  function removeCartItem(index: number) {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  }

  function computeFinalItems(): CartItem[] | null {
    if (currentItemHasContent() || cartItems.length === 0) {
      const error = validateCurrentItem();
      if (error) {
        setFileError(error);
        return null;
      }
      return [...cartItems, currentItemSnapshot()];
    }
    return cartItems;
  }

  async function submitOrder(finalItems: CartItem[], method: "pix" | "card") {
    if (!formRef.current) return;
    setSubmitError(null);

    const formData = new FormData(formRef.current);
    formData.set("paymentMethod", method);
    formData.set("itemCount", String(finalItems.length));
    finalItems.forEach((item, i) => {
      formData.set(`item_${i}_paperSize`, item.paperSize);
      formData.set(`item_${i}_theme`, item.theme);
      formData.set(`item_${i}_quantity`, String(item.quantity));
      formData.set(`item_${i}_description`, itemFinalDescription(item));
      item.files.forEach((file) => formData.append(`item_${i}_referenceFiles`, file));
    });

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Não foi possível enviar sua encomenda. Tente novamente.");
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.quotePending) {
        router.push(`/pedido-recebido?order_id=${data.orderId}`);
        return;
      }

      if (data.pixPending) {
        router.push(`/pedido-pix?order_id=${data.orderId}`);
        return;
      }

      setSubmitError("Encomenda registrada, mas o pagamento não pôde ser iniciado. Entraremos em contato.");
      setSubmitting(false);
    } catch {
      setSubmitError("Falha de conexão. Verifique sua internet e tente novamente.");
      setSubmitting(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const finalItems = computeFinalItems();
    if (!finalItems) return;

    const hasCustom = finalItems.some((item) => itemUnitPrice(item) === null);
    if (hasCustom) {
      submitOrder(finalItems, "card");
    } else {
      setReadyToChoosePayment(true);
    }
  }

  function handleChoosePayment(method: "pix" | "card") {
    const finalItems = computeFinalItems();
    if (!finalItems) {
      setReadyToChoosePayment(false);
      return;
    }
    submitOrder(finalItems, method);
  }

  const currentUnitPrice = PAPER_SIZES[paperSize].priceCents;
  const isCustomSize = currentUnitPrice === null;
  const themeLabel = THEMES.find((t) => t.value === theme)?.label ?? "";

  const willIncludeCurrent = currentItemHasContent() || cartItems.length === 0;
  const cartHasCustom = cartItems.some((item) => itemUnitPrice(item) === null);
  const overallHasCustom = cartHasCustom || (willIncludeCurrent && isCustomSize);

  const cartSubtotal = cartItems.reduce((sum, item) => {
    const unit = itemUnitPrice(item);
    return unit === null ? sum : sum + unit * item.quantity;
  }, 0);
  const currentSubtotal = willIncludeCurrent && currentUnitPrice !== null ? currentUnitPrice * quantity : 0;
  const grandTotal = overallHasCustom ? null : cartSubtotal + currentSubtotal;

  const totalPieceCount =
    cartItems.reduce((n, item) => n + item.quantity, 0) + (willIncludeCurrent ? quantity : 0);
  const distinctDesignCount = cartItems.length + (willIncludeCurrent ? 1 : 0);

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="mt-10">
      <div className="grid gap-10 pb-28 lg:grid-cols-[1fr_320px] lg:items-start lg:pb-0">
        <div className="space-y-12">
          {cartItems.length > 0 && (
            <p className="font-serif-display text-lg text-accent">
              Desenho {cartItems.length + 1}
            </p>
          )}

          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="font-serif-display text-3xl text-accent/40">01</span>
              <span className="font-serif-display text-xl text-foreground">Tamanho do papel</span>
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(Object.keys(PAPER_SIZES) as PaperSize[]).map((size) => {
                const opt = PAPER_SIZES[size];
                const selected = paperSize === size;
                const isCustom = opt.priceCents === null;
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => setPaperSize(size)}
                    aria-pressed={selected}
                    className={`border p-5 text-left transition-colors ${isCustom ? "sm:col-span-2 border-dashed" : ""} ${
                      selected ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-serif-display text-2xl text-foreground">{opt.label}</span>
                      <span className={isCustom ? "text-sm font-medium text-accent" : "text-accent"}>
                        {formatPrice(opt.priceCents)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{opt.dimensions}</p>
                    <p className="mt-2 text-sm text-foreground/70">{opt.description}</p>
                  </button>
                );
              })}
            </div>

            {paperSize === "personalizado" && (
              <div className="mt-4">
                <label className="text-sm text-foreground/70" htmlFor="customSize">
                  Que tamanho você imagina?
                </label>
                <input
                  id="customSize"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  type="text"
                  placeholder="Ex: 30x40 cm, ou 'um quadro grande pra sala'"
                  className="mt-1 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border border-border bg-surface p-4">
              <div>
                <p className="text-sm text-foreground">Quantas cópias desse desenho?</p>
                <p className="text-xs text-muted">Pinturas idênticas, feitas à mão uma a uma.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="flex h-9 w-9 items-center justify-center border border-border bg-background hover:border-accent"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-serif-display text-lg text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                  aria-label="Aumentar quantidade"
                  className="flex h-9 w-9 items-center justify-center border border-border bg-background hover:border-accent"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">
              * Tamanhos de folha diferentes ou desenhos muito detalhados podem alterar o
              valor final — combinamos com você antes de confirmar, se for o caso.
            </p>
          </fieldset>

          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="font-serif-display text-3xl text-accent/40">02</span>
              <span className="font-serif-display text-xl text-foreground">Qual o tema?</span>
            </legend>
            <div className="mt-4 flex flex-wrap gap-3">
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  aria-pressed={theme === t.value}
                  className={`border px-5 py-2 text-sm transition-colors ${
                    theme === t.value
                      ? "border-accent bg-accent text-white"
                      : "border-border text-foreground/80 hover:border-accent/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {theme === "outro" && (
              <div className="mt-4">
                <label className="text-sm text-foreground/70" htmlFor="themeOther">
                  Qual o tema, então?
                </label>
                <input
                  id="themeOther"
                  value={themeOther}
                  onChange={(e) => setThemeOther(e.target.value)}
                  type="text"
                  placeholder="Ex: paisagem, símbolo, cena específica..."
                  className="mt-1 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
                />
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="font-serif-display text-3xl text-accent/40">03</span>
              <span className="font-serif-display text-xl text-foreground">Foto(s) de referência</span>
            </legend>
            <p className="mt-2 text-sm text-foreground/70">
              Envie a foto que vai inspirar a pintura. Prefira fotos nítidas, bem
              iluminadas e de frente. Até {MAX_FILES} fotos, 10MB cada.
            </p>

            <div
              className={`mt-4 cursor-pointer border border-dashed p-8 text-center transition-colors ${
                isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/60"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <ImageIcon size={22} className="mx-auto text-muted" />
              <p className="mt-2 text-sm text-foreground/70">
                Arraste as fotos aqui ou <span className="text-accent underline">clique para escolher</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {fileError && <p className="mt-2 text-sm text-accent">{fileError}</p>}

            {files.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {files.map((file, i) => (
                  <li key={i} className="relative aspect-square overflow-hidden border border-border">
                    {previews[i] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[i]}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-white"
                      aria-label={`Remover ${file.name}`}
                    >
                      <X size={13} />
                    </button>
                    <span className="absolute inset-x-0 bottom-0 truncate bg-foreground/70 px-2 py-1 text-[10px] text-white">
                      {file.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="font-serif-display text-3xl text-accent/40">04</span>
              <span className="font-serif-display text-xl text-foreground">
                Descreva o que você imagina
              </span>
            </legend>
            <p className="mt-2 text-sm text-foreground/70">
              Conte detalhes que não aparecem na foto: cores que você gosta, se quer
              incluir fundo ou deixar neutro, algo especial que a peça deve representar.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Ex: quero o casal da foto, com fundo neutro em tons pastel, focando do peito para cima..."
              className="mt-4 w-full border border-border bg-surface p-4 text-sm outline-none focus:border-accent"
            />
          </fieldset>

          {cartItems.length > 0 && (
            <div className="border border-border bg-surface p-4">
              <p className="font-serif-display text-lg text-foreground">Desenhos já adicionados</p>
              <ul className="mt-3 space-y-2">
                {cartItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-border bg-background">
                        {cartPreviews[i] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cartPreviews[i]!} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-muted" />
                        )}
                      </div>
                      <span className="text-foreground/80">
                        {PAPER_SIZES[item.paperSize].label} ·{" "}
                        {THEMES.find((t) => t.value === item.theme)?.label ?? item.theme} · Qtd:{" "}
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-accent">
                        {formatPrice(
                          itemUnitPrice(item) === null ? null : itemUnitPrice(item)! * item.quantity
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCartItem(i)}
                        aria-label={`Remover desenho ${i + 1}`}
                        className="text-muted hover:text-accent"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddAnother}
            className="flex items-center gap-2 border border-dashed border-accent px-5 py-3 text-sm text-accent transition-colors hover:bg-accent/5"
          >
            <Plus size={16} /> Adicionar outro desenho
          </button>

          <fieldset>
            <legend className="flex items-baseline gap-3">
              <span className="font-serif-display text-3xl text-accent/40">05</span>
              <span className="font-serif-display text-xl text-foreground">Seus dados</span>
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm text-foreground/70" htmlFor="name">Nome completo</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70" htmlFor="phone">WhatsApp / telefone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="(11) 91234-5678"
                  className="mt-1 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>
          </fieldset>

        </div>

        <aside className="hidden lg:block lg:sticky lg:top-28">
          <div className="border border-border bg-surface p-6">
            {distinctDesignCount === 1 ? (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-border bg-background">
                  {previews[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-muted" />
                  )}
                </div>
                <div>
                  <p className="font-serif-display text-lg text-foreground">
                    {isCustomSize ? "Aquarela sob medida" : `Aquarela ${PAPER_SIZES[paperSize].label}`}
                  </p>
                  <p className="text-xs text-muted">
                    {themeLabel}
                    {quantity > 1 ? ` · Qtd ${quantity}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-serif-display text-lg text-foreground">
                  {totalPieceCount} {totalPieceCount === 1 ? "peça" : "peças"}
                </p>
                <p className="text-xs text-muted">
                  {distinctDesignCount} desenhos diferentes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cartItems.map((item, i) => (
                    <div
                      key={i}
                      className="relative h-14 w-14 shrink-0 overflow-hidden border border-border bg-background"
                    >
                      {cartPreviews[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cartPreviews[i]!} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="absolute inset-0 m-auto text-muted" />
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute right-0 bottom-0 bg-foreground/70 px-1 text-[9px] text-white">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                  {willIncludeCurrent && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-dashed border-accent bg-background">
                      {previews[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previews[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="absolute inset-0 m-auto text-muted" />
                      )}
                      {quantity > 1 && (
                        <span className="absolute right-0 bottom-0 bg-foreground/70 px-1 text-[9px] text-white">
                          x{quantity}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm text-foreground/70">{overallHasCustom ? "Valor" : "Total"}</span>
              <span className="font-serif-display text-2xl text-accent">{formatPrice(grandTotal)}</span>
            </div>
            {overallHasCustom && (
              <p className="mt-1 text-xs text-muted">
                Sem cobrança agora — enviamos um orçamento antes de qualquer pagamento.
              </p>
            )}

            {submitError && <p className="mt-4 text-xs text-accent">{submitError}</p>}

            {!overallHasCustom && readyToChoosePayment ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setReadyToChoosePayment(false)}
                  className="text-xs text-muted underline"
                >
                  ‹ Voltar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleChoosePayment("pix")}
                  className="flex w-full items-center justify-center gap-2 border-2 border-accent bg-accent px-6 py-4 text-base font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
                >
                  <QrCode size={20} /> {submitting ? "Enviando..." : "Pagar com Pix"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleChoosePayment("card")}
                  className="flex w-full items-center justify-center gap-2 border-2 border-accent px-6 py-4 text-base font-medium text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
                >
                  <CreditCard size={20} /> {submitting ? "Enviando..." : "Pagar com cartão"}
                </button>
              </div>
            ) : (
              <Button type="submit" disabled={submitting} className="mt-4 w-full">
                {submitting
                  ? "Enviando..."
                  : overallHasCustom
                    ? "Enviar pedido de orçamento"
                    : "Ir para pagamento"}
              </Button>
            )}

            <ul className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-foreground/70">
              <li className="flex items-center gap-2">
                <Paintbrush size={14} className="shrink-0 text-accent" /> Pintado à mão, peça única
              </li>
              <li className="flex items-center gap-2">
                <Lock size={14} className="shrink-0 text-accent" />
                {overallHasCustom ? "Orçamento sem compromisso" : "Pague com Pix ou cartão"}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-accent" /> Você acompanha cada etapa por e-mail
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-6 py-4 backdrop-blur lg:hidden">
        {!overallHasCustom && readyToChoosePayment ? (
          <div className="mx-auto max-w-3xl space-y-2">
            <button
              type="button"
              onClick={() => setReadyToChoosePayment(false)}
              className="text-xs text-muted underline"
            >
              ‹ Voltar
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleChoosePayment("pix")}
                className="flex flex-1 items-center justify-center gap-2 border-2 border-accent bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <QrCode size={16} /> Pix
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleChoosePayment("card")}
                className="flex flex-1 items-center justify-center gap-2 border-2 border-accent px-4 py-3 text-sm font-medium text-accent disabled:opacity-60"
              >
                <CreditCard size={16} /> Cartão
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-muted">{overallHasCustom ? "Valor" : "Total"}</p>
              <p className="font-serif-display text-lg text-accent">{formatPrice(grandTotal)}</p>
            </div>
            <Button type="submit" disabled={submitting} className="flex-1 max-w-[220px]">
              {submitting
                ? "Enviando..."
                : overallHasCustom
                  ? "Enviar orçamento"
                  : "Ir para pagamento"}
            </Button>
          </div>
        )}
        {submitError && (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-accent">{submitError}</p>
        )}
      </div>
    </form>
  );
}
