import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMessages } from "@/lib/data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const messages = await getMessages(id);
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
