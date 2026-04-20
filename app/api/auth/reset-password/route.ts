import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { token, password } = body ?? {};

  if (!token || !password || password.length < 8)
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const [rows] = await pool.query(
    "SELECT id FROM admin_users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [tokenHash]
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
