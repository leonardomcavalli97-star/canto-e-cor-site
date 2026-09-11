import { NextRequest, NextResponse } from "next/server";
import { listOrders, listAllOrders, deleteOrphanUploads, markReminderSent, purgeOldTrash } from "@/lib/orders";
import { sendPaymentReminderEmail, sendAdminBackupEmail } from "@/lib/email";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

const REMINDER_AFTER_MS = 48 * 60 * 60 * 1000;
const TRASH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const results = { orphansDeleted: 0, trashPurged: 0, remindersSent: 0, backupSent: false };

  try {
    results.orphansDeleted = await deleteOrphanUploads();
  } catch (error) {
    console.error("Cron diário: falha ao limpar uploads órfãos", error);
  }

  try {
    results.trashPurged = await purgeOldTrash(TRASH_MAX_AGE_MS);
  } catch (error) {
    console.error("Cron diário: falha ao esvaziar lixeira antiga", error);
  }

  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  try {
    orders = await listOrders();
  } catch (error) {
    console.error("Cron diário: falha ao listar pedidos", error);
    return NextResponse.json(results);
  }

  const staleOrders = orders.filter((o) => {
    if (o.status !== "pix_pending" && o.status !== "pending_payment") return false;
    if (o.reminderSentAt) return false;
    return Date.now() - new Date(o.createdAt).getTime() > REMINDER_AFTER_MS;
  });

  for (const order of staleOrders) {
    try {
      const pixUrl = `https://www.cantoecor.com/pedido-pix?order_id=${order.id}`;
      await sendPaymentReminderEmail(order.email, order.name, pixUrl);
      await markReminderSent(order.id);
      results.remindersSent += 1;
    } catch (error) {
      console.error("Cron diário: falha ao enviar lembrete de pagamento", order.id, error);
    }
  }

  // Backup semanal (só aos domingos) pra não mandar e-mail com anexo todo dia.
  // Inclui pedidos na lixeira também — é o backup, nada deveria faltar nele.
  if (new Date().getDay() === 0) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      try {
        const allOrders = await listAllOrders();
        const header = [
          "ID",
          "Data",
          "Status",
          "Nome",
          "E-mail",
          "Telefone",
          "Total (R$)",
          "Cidade",
          "Estado",
          "Pago em",
          "Excluído em",
        ];
        const rows = allOrders.map((o) => [
          o.id,
          o.createdAt,
          o.status,
          o.name,
          o.email,
          o.phone,
          o.totalPriceCents !== null ? (o.totalPriceCents / 100).toFixed(2) : "",
          o.shippingAddress.city,
          o.shippingAddress.state,
          o.paidAt ?? "",
          o.deletedAt ?? "",
        ]);
        const csv = [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
        await sendAdminBackupEmail(
          adminEmail,
          csv,
          `backup-pedidos-${new Date().toISOString().slice(0, 10)}.csv`
        );
        results.backupSent = true;
      } catch (error) {
        console.error("Cron diário: falha ao enviar backup semanal", error);
      }
    }
  }

  return NextResponse.json(results);
}
