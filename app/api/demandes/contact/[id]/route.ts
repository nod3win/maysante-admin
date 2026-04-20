import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id } = await params;
  const [rows] = await pool.query("SELECT * FROM contacts WHERE id = ?", [id]);
  const row = (rows as object[])[0];
  if (!row) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return NextResponse.json(row);
}
