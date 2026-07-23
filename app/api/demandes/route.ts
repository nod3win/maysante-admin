import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset = (page - 1) * limit;

  // Pagination et tri en SQL : on ne charge jamais toutes les demandes en mémoire.
  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM (
       SELECT id, 'contact' AS type, nom, email, telephone, message,
              NULL AS prenom, NULL AS type_soin, created_at
       FROM contacts
       UNION ALL
       SELECT id, 'appel' AS type, nom, NULL AS email, telephone, NULL AS message,
              prenom, type_soin, created_at
       FROM appels
     ) AS demandes
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT (SELECT COUNT(*) FROM contacts) AS contacts,
            (SELECT COUNT(*) FROM appels) AS appels`,
  );
  const counts = countRows[0] as { contacts: number; appels: number };
  const totalContacts = Number(counts.contacts);
  const totalAppels = Number(counts.appels);

  return NextResponse.json({
    items,
    total: totalContacts + totalAppels,
    totalContacts,
    totalAppels,
    page,
    limit,
  });
}
