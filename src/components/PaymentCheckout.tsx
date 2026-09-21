"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, QrCode } from "lucide-react";
import { MAX_INSTALLMENTS, formatBRL } from "@/lib/pricing";

type PaymentData = {
  amountCents: number;
  name: string;
  status: string;
  paymentAvailable: boolean;
};

const POLL_INTERVAL_MS = 5000;

export default function PaymentCheckout({ orderId }: { orderId: string }) {
  const [data, setData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<"pix" | "card" | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [returningFromCheckout] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("transaction_nsu")
  );

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
        const res = await fetch(`/api/orders/${orderId}/payment`);
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(json.error ?? "Não foi possível carregar o pagamento.");
          return;
        }

        setData(json);
        setError(null);
        if (json.status === "paid" || json.status === "shipped") {
          clearInterval(intervalId);
        }
      } catch {
        if (!cancelled) setError("Falha de conexão. Recarregue a página em instantes.");
      }
    }

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [orderId]);

  async function handlePay(method: "pix" | "card") {
    setStarting(method);
    setStartError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/infinitepay`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setStartError(json.error ?? "Não foi possível abrir o pagamento agora.");
        setStarting(null);
        return;
      }
      window.location.href = json.url;
    } catch {
      setStartError("Falha de conexão. Tente novamente.");
      setStarting(null);
    }
  }

  if (error) {
    return <p className="mt-10 text-sm text-accent">{error}</p>;
  }

  if (!data) {
    return <p className="mt-10 text-sm text-foreground/70">Carregando o pagamento...</p>;
  }

  if (data.status === "paid" || data.status === "shipped") {
    return (
      <div className="mt-10 border border-accent bg-accent/5 p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-accent" />
        <p className="mt-4 font-serif-display text-2xl text-foreground">Pagamento confirmado!</p>
        <p className="mt-2 text-sm text-foreground/70">
          Recebemos o seu pagamento. Em breve entraremos em contato pelo e-mail ou
          WhatsApp para dar início à pintura.
        </p>
      </div>
    );
  }

  if (returningFromCheckout) {
    return (
      <div className="mt-10 border border-border bg-surface p-8 text-center">
        <Loader2 size={32} className="mx-auto animate-spin text-accent" />
        <p className="mt-4 font-serif-display text-2xl text-foreground">
          Confirmando o seu pagamento...
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          Isso leva só alguns segundos. Você não precisa fazer mais nada — também
          avisamos por e-mail assim que for confirmado.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 border border-border bg-surface p-6 text-left">
      <p className="text-sm text-foreground/70">Valor a pagar</p>
      <p className="font-serif-display text-4xl text-accent">{formatBRL(data.amountCents)}</p>

      {data.paymentAvailable ? (
        <>
          <p className="mt-6 text-sm font-medium text-foreground">Como você quer pagar?</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handlePay("pix")}
              disabled={starting !== null}
              className="flex flex-col items-start gap-1 border-2 border-accent bg-accent px-5 py-4 text-left text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm tracking-wide uppercase">
                {starting === "pix" ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                Pagar com Pix
              </span>
              <span className="text-xs text-white/80">À vista · confirmação na hora</span>
            </button>

            <button
              type="button"
              onClick={() => handlePay("card")}
              disabled={starting !== null}
              className="flex flex-col items-start gap-1 border-2 border-accent bg-background px-5 py-4 text-left text-accent transition-colors hover:bg-accent/5 disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm tracking-wide uppercase">
                {starting === "card" ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Parcelar no cartão
              </span>
              <span className="text-xs text-accent/80">Em até {MAX_INSTALLMENTS}x</span>
            </button>
          </div>
          {startError && <p className="mt-3 text-sm text-accent">{startError}</p>}

          <p className="mt-4 text-xs text-foreground/60">
            Você será levado(a) ao ambiente seguro da InfinitePay para concluir o
            pagamento e ver as condições de parcelamento. Seus dados de cartão não
            passam por este site. Ao concluir, o pagamento é confirmado automaticamente
            e você recebe um e-mail.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-accent">
          O pagamento online está indisponível no momento. Entre em contato com o ateliê
          para finalizar o seu pedido.
        </p>
      )}
    </div>
  );
}
