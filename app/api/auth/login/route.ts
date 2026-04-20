import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { signToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${getIp(req)}`, 5, 15 * 60 * 1000))
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password)
    return NextResponse.json({ error: "Champs requis." }, { status: 400 });

  const [rows] = await pool.query(
    "SELECT id, email, password_hash, is_super_admin FROM admin_users WHERE email = ?",
    [body.email]
  );
  const user = (rows as { id: number; email: string; password_hash: string; is_super_admin: number }[])[0];

  if (!user || user.password_hash === "!invalid" || !(await bcrypt.compare(body.password, user.password_hash)))
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });

  const token = await signToken({ id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === 1 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
