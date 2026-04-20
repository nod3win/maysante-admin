import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.label !== undefined) { fields.push("label = ?"); values.push(body.label); }
  if (body.active !== undefined) { fields.push("active = ?"); values.push(body.active ? 1 : 0); }
  if (body.email !== undefined) { fields.push("email = ?"); values.push(body.email); }

  if (fields.length === 0)
    return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });

  values.push(id);
  await pool.query(`UPDATE notification_emails SET ${fields.join(", ")} WHERE id = ?`, values);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id } = await params;
  await pool.query("DELETE FROM notification_emails WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
