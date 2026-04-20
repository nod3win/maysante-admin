import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const [contacts] = await pool.query(
    "SELECT id, 'contact' as type, nom, email, telephone, message, NULL as prenom, NULL as type_soin, created_at FROM contacts ORDER BY created_at DESC"
  );
  const [appels] = await pool.query(
    "SELECT id, 'appel' as type, nom, NULL as email, telephone, NULL as message, prenom, type_soin, created_at FROM appels ORDER BY created_at DESC"
  );

  const all = [
    ...(contacts as object[]),
    ...(appels as object[]),
  ].sort((a, b) => {
    const da = new Date((a as { created_at: string }).created_at).getTime();
    const db = new Date((b as { created_at: string }).created_at).getTime();
    return db - da;
  });

  return NextResponse.json(all);
}
