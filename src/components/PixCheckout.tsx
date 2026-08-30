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
};

const POLL_INTERVAL_MS = 8000;

export default function PixCheckout({ orderId }: { orderId: string }) {
  const [data, setData] = useState<PixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
          Recebemos o seu Pix. Em breve entraremos em contato pelo e-mail ou WhatsApp
          para dar início à pintura.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 border border-border bg-surface p-6 text-left">
      <p className="text-sm text-foreground/70">Valor a pagar</p>
      <p className="font-serif-display text-3xl text-accent">{formatBRL(data.amountCents)}</p>

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
        Assim que confirmarmos o recebimento, essa página atualiza sozinha — não
        precisa recarregar.
      </p>
    </div>
  );
}
