import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { rateLimit, getIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`forgot:${getIp(req)}`, 3, 15 * 60 * 1000))
    return NextResponse.json({ ok: true }); // réponse neutre pour éviter l'énumération

  const body = await req.json().catch(() => null);
  const email = body?.email;
  if (!email) return NextResponse.json({ ok: true });

  const [rows] = await pool.query(
    "SELECT id FROM admin_users WHERE email = ?",
    [email]
  );
  const user = (rows as { id: number }[])[0];
  if (!user) return NextResponse.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await pool.query(
    "UPDATE admin_users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
    [tokenHash, expires, user.id]
  );

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;

  await sendMail({
    to: email,
    subject: "Réinitialisation de mot de passe — Corporus Admin",
    html: `
      <h2 style="margin:0 0 12px;font-size:18px;color:#0a0a0a">Réinitialisation de mot de passe</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#737373">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans <strong>1 heure</strong>.</p>
      <a href="${link}" style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Réinitialiser mon mot de passe →</a>
      <p style="margin-top:24px;font-size:11px;color:#b0b0b0">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `,
  }).catch((err) => console.error("[forgot-password] Email error:", err));

  return NextResponse.json({ ok: true });
}
