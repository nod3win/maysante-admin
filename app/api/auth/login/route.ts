import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Champs requis." }, { status: 400 });

  const [rows] = await pool.query(
    "SELECT id, email, password_hash FROM admin_users WHERE email = ?",
    [email]
  );
  const user = (rows as { id: number; email: string; password_hash: string }[])[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });

  const token = await signToken({ id: user.id, email: user.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
