import { Resend } from "resend";
import { formatBRL } from "./pricing";

const FROM_EMAIL = "Canto e Cor <pedidos@cantoecor.com>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendQuoteReadyEmail(
  to: string,
  name: string,
  amountCents: number,
  pixUrl: string
) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu orçamento está pronto! · Canto e Cor",
    html: `
      <div style="font-family: Georgia, serif; color: #3a2a2a; max-width: 480px; margin: 0 auto;">
        <p style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #a15c5c;">Canto e Cor</p>
        <h1 style="font-size: 24px; margin: 8px 0 16px;">Seu orçamento está pronto!</h1>
        <p>Olá, ${name}!</p>
        <p>O valor combinado para o seu pedido personalizado é <strong>${formatBRL(amountCents)}</strong>.</p>
        <p>Pague com Pix pelo link abaixo:</p>
        <p>
          <a href="${pixUrl}" style="color: #a15c5c;">Pagar com Pix</a>
        </p>
        <p>Assim que o pagamento for confirmado, começamos a pintar!</p>
        <p style="margin-top: 24px;">Com carinho,<br />Canto e Cor</p>
      </div>
    `,
  });
}

export async function sendOrderShippedEmail(to: string, name: string) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu pedido foi enviado! · Canto e Cor",
    html: `
      <div style="font-family: Georgia, serif; color: #3a2a2a; max-width: 480px; margin: 0 auto;">
        <p style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #a15c5c;">Canto e Cor</p>
        <h1 style="font-size: 24px; margin: 8px 0 16px;">Sua aquarela está a caminho!</h1>
        <p>Olá, ${name}!</p>
        <p>Seu pedido acabou de ser enviado e já está a caminho do endereço que você cadastrou.</p>
        <p>Qualquer dúvida, é só responder este e-mail.</p>
        <p style="margin-top: 24px;">Com carinho,<br />Canto e Cor</p>
      </div>
    `,
  });
}
