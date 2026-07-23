import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import pool from "./db";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface AdminPayload {
  id: number;
  email: string;
  isSuperAdmin: boolean;
}

export async function signToken(payload: AdminPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminPayload | null> {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return null;

  const jwtPayload = await verifyToken(token);
  if (!jwtPayload) return null;

  // #12 vérification que l'utilisateur existe toujours + données fraîches
  try {
    const [rows] = await pool.query(
      "SELECT id, email, is_super_admin FROM admin_users WHERE id = ?",
      [jwtPayload.id]
    );
    const user = (rows as { id: number; email: string; is_super_admin: number }[])[0];
    if (!user) return null;
    return { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === 1 };
  } catch (err) {
    console.error("[getSession] DB error:", err);
    return null;
  }
}

/** Renvoie la session admin, ou une réponse 401 prête à être retournée. */
export async function requireSession(): Promise<AdminPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  return session;
}
