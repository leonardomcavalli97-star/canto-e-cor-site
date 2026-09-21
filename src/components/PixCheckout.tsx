"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { formatBRL } from "@/lib/pricing";

type PixData = {
  brCode: string;
  qrCodeImage: string;
  amountCents: number;
  name: string;
  status: string;
  cardAvailable?: boolean;
};

const POLL_INTERVAL_MS = 8000;

export default function PixCheckout({ orderId }: { orderId: string }) {
  const [data, setData] = useState<PixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionNsu = params.get("transaction_nsu");
    const slug = params.get("slug");
    if (!transactionNsu || !slug) return;
    void fetch(`/api/orders/${orderId}/infinitepay/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_nsu: transactionNsu,
        slug,
        receipt_url: params.get("receipt_url") ?? undefined,
      }),
    }).catch(() => {});
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}/pix`);
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(json.error ?? "Não foi possível gerar o Pix.");
          return;
        }

        setData(json);
        setError(null);
        if (json.status === "paid") {
          clearInterval(intervalId);
        }
      } catch {
        if (!cancelled) setError("Falha de conexão ao verificar o pagamento.");
      }
    }

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [orderId]);

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCard() {
    setCardLoading(true);
    setCardError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/infinitepay`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setCardError(json.error ?? "Não foi possível abrir o pagamento agora.");
        setCardLoading(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setCardError("Falha de conexão. Tente novamente ou pague com Pix.");
      setCardLoading(false);
    }
  }

  if (error) {
    return <p className="mt-10 text-sm text-accent">{error}</p>;
  }

  if (!data) {
    return <p className="mt-10 text-sm text-foreground/70">Gerando o código Pix...</p>;
  }

  if (data.status === "paid") {
    return (
      <div className="mt-10 border border-accent bg-accent/5 p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-accent" />
        <p className="mt-4 font-serif-display text-2xl text-foreground">
          Pagamento confirmado!
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          Recebemos o seu pagamento. Em breve entraremos em contato pelo e-mail ou
          WhatsApp para dar início à pintura.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 border border-border bg-surface p-6 text-left">
      <p className="text-sm text-foreground/70">Valor a pagar</p>
      <p className="font-serif-display text-3xl text-accent">{formatBRL(data.amountCents)}</p>

      {data.cardAvailable && (
        <div className="mt-6 border border-accent bg-accent/5 p-5">
          <p className="text-sm font-medium text-foreground">
            Pagar no cartão em até 12x, ou Pix com confirmação automática
          </p>
          <p className="mt-1 text-xs text-foreground/70">
            Você é levado(a) ao ambiente seguro da InfinitePay. As condições de
            parcelamento aparecem na tela de pagamento e a confirmação é imediata.
          </p>
          <button
            type="button"
            onClick={handleCard}
            disabled={cardLoading}
            className="mt-4 w-full bg-accent px-4 py-3 text-sm tracking-wide text-white uppercase transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {cardLoading ? "Abrindo..." : "Pagar no cartão / parcelar"}
          </button>
          {cardError && <p className="mt-2 text-xs text-accent">{cardError}</p>}
          <p className="mt-5 text-center text-xs tracking-widest text-foreground/50 uppercase">
            ou pague com Pix abaixo (confirmação manual)
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.qrCodeImage}
          alt="QR Code Pix"
          className="h-56 w-56 border border-border bg-white p-2"
        />
      </div>

      <p className="mt-6 text-sm text-foreground/70">
        Escaneie o QR Code pelo app do seu banco, ou copie o código abaixo e cole na
        opção &quot;Pix Copia e Cola&quot;:
      </p>

      <div className="mt-3 flex items-start gap-2">
        <code className="flex-1 overflow-x-auto border border-border bg-background p-3 text-xs break-all text-foreground/80">
          {data.brCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1 border border-accent px-3 py-3 text-xs text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <p className="mt-6 text-sm text-foreground/70">
        Depois de pagar, pode fechar esta página. A confirmação é feita manualmente
        e pode levar até 24 horas — assim que confirmarmos, você recebe um e-mail
        avisando. Se ela estiver aberta quando confirmarmos, atualiza sozinha.
      </p>
    </div>
  );
}
