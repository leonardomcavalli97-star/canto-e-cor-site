import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { get } from "@vercel/blob";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/files/[...path]">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { path } = await ctx.params;
  const pathname = path.join("/");

  if (!pathname.startsWith("uploads/")) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: { "content-type": result.blob.contentType },
  });
}
