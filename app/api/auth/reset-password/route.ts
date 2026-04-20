import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password)
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const [rows] = await pool.query(
    "SELECT id FROM admin_users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [token]
  );
  const user = (rows as { id: number }[])[0];
  if (!user)
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    "UPDATE admin_users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
    [hash, user.id]
  );

  return NextResponse.json({ ok: true });
}
