import pool from "./db";
import { sendMail } from "./mailer";
import type { RowDataPacket } from "mysql2";

export async function notifyAllAdmins(opts: {
  subject: string;
  html: string;
}): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT email FROM admin_users"
  );
  const emails = (rows as { email: string }[]).map((r) => r.email);
  if (emails.length === 0) return;

  await Promise.allSettled(
    emails.map((to) => sendMail({ to, subject: opts.subject, html: opts.html }))
  );
}
