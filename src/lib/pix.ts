import { createStaticPix } from "pix-utils";

// Dados temporários (chave Pix do Leonardo) — trocar pela chave e pelo nome
// da Lívia assim que ela definir qual chave Pix o ateliê vai usar.
const PIX_KEY = "47266960843";
const PIX_MERCHANT_NAME = "LEONARDO M CAVALLI";
const PIX_MERCHANT_CITY = "CAMPO GRANDE MS";

export async function buildPix({
  amountCents,
  txid,
}: {
  amountCents: number;
  txid: string;
}) {
  const pix = createStaticPix({
    merchantName: PIX_MERCHANT_NAME,
    merchantCity: PIX_MERCHANT_CITY,
    pixKey: PIX_KEY,
    transactionAmount: amountCents / 100,
    txid: txid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25),
  }).throwIfError();

  return {
    brCode: pix.toBRCode(),
    qrCodeImage: await pix.toImage(),
  };
}
