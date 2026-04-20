import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const [rows] = await pool.query(
    "SELECT id, email, created_at FROM admin_users WHERE is_super_admin = 0 ORDER BY created_at DESC"
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

  const [existing] = await pool.query(
    "SELECT id FROM admin_users WHERE email = ?", [email]
  );
  if ((existing as unknown[]).length > 0)
    return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 48);

  await pool.query(
    "INSERT INTO admin_users (email, password_hash, reset_token, reset_token_expires) VALUES (?, ?, ?, ?)",
    [email, "!invalid", token, expires]
  );

  await pool.query(
    "INSERT IGNORE INTO notification_emails (email, label) VALUES (?, ?)",
    [email, "Admin"]
  );

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendMail({
    to: email,
    subject: "Bienvenue sur Corporus Admin — Créez votre mot de passe",
    html: `
      <h2 style="margin:0 0 12px;font-size:18px;color:#0a0a0a">Accès à la plateforme Corporus</h2>
      <p style="margin:0 0 8px;font-size:13px;color:#737373">Un accès à la plateforme admin Maysanté vient d'être créé pour votre adresse email.</p>
      <p style="margin:0 0 20px;font-size:13px;color:#737373">Cliquez sur le bouton ci-dessous pour créer votre mot de passe. Ce lien est valable <strong>48 heures</strong>.</p>
      <a href="${link}" style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Créer mon mot de passe →</a>
      <p style="margin-top:24px;font-size:11px;color:#b0b0b0">Si vous n'attendiez pas cet email, vous pouvez l'ignorer.</p>
    `,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
