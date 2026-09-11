import { createStaticPix } from "pix-utils";

const PIX_MERCHANT_NAME = "LIVIA DAVILA LOPES";
const PIX_MERCHANT_CITY = "CAMPO GRANDE MS";

export async function buildPix({
  amountCents,
  txid,
}: {
  amountCents: number;
  txid: string;
}) {
  const pixKey = process.env.PIX_KEY;
  if (!pixKey) {
    throw new Error(
      "PIX_KEY não configurada — defina a variável de ambiente na Vercel antes de gerar cobranças."
    );
  }

  const pix = createStaticPix({
    merchantName: PIX_MERCHANT_NAME,
    merchantCity: PIX_MERCHANT_CITY,
    pixKey,
    transactionAmount: amountCents / 100,
    txid: txid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25),
  }).throwIfError();

  return {
    brCode: pix.toBRCode(),
    qrCodeImage: await pix.toImage(),
  };
}
