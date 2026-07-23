import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (!session.isSuperAdmin) return NextResponse.json({ error: "Réservé au superadmin." }, { status: 403 });

  const { id } = await params;
  if (Number(id) === session.id)
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });

  const [rows] = await pool.query(
    "SELECT email FROM admin_users WHERE id = ? AND is_super_admin = 0", [id]
  );
  const user = (rows as { email: string }[])[0];
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  await pool.query("DELETE FROM admin_users WHERE id = ?", [id]);
  await pool.query("DELETE FROM notification_emails WHERE email = ?", [user.email]);

  return NextResponse.json({ ok: true });
}
