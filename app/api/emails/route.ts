import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const [rows] = await pool.query("SELECT * FROM notification_emails ORDER BY created_at DESC");
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { email, label } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

  const [result] = await pool.query(
    "INSERT INTO notification_emails (email, label) VALUES (?, ?)",
    [email, label ?? null]
  );
  const id = (result as { insertId: number }).insertId;
  return NextResponse.json({ id, email, label, active: 1 }, { status: 201 });
}
