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
  // Fallback mantém o site funcionando caso PIX_KEY ainda não tenha sido
  // configurada na Vercel — defina a variável de ambiente para trocar a chave
  // sem precisar editar código.
  const pixKey = process.env.PIX_KEY || "+5567998891606";

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
