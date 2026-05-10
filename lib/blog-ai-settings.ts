import pool from "./db";
import type { RowDataPacket } from "mysql2";

export type DayCode = "mon" | "tue" | "wed" | "thu" | "fri";
export const ALL_DAYS: DayCode[] = ["mon", "tue", "wed", "thu", "fri"];

export interface BlogAiSettings {
  enabled: boolean;
  days_of_week: DayCode[];
  theme: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

function parseDays(csv: string): DayCode[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d): d is DayCode => (ALL_DAYS as string[]).includes(d));
}

export async function getSettings(): Promise<BlogAiSettings> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT enabled, days_of_week, theme, last_run_at, last_status, last_error FROM blog_ai_settings WHERE id = 1"
  );
  const row = rows[0];
  if (!row) {
    return {
      enabled: false,
      days_of_week: [],
      theme: null,
      last_run_at: null,
      last_status: null,
      last_error: null,
    };
  }
  return {
    enabled: row.enabled === 1,
    days_of_week: parseDays(row.days_of_week ?? ""),
    theme: row.theme ?? null,
    last_run_at: row.last_run_at,
    last_status: row.last_status,
    last_error: row.last_error,
  };
}

export async function saveSettings(data: {
  enabled: boolean;
  days_of_week: DayCode[];
  theme: string | null;
}): Promise<void> {
  const csv = data.days_of_week
    .filter((d) => (ALL_DAYS as string[]).includes(d))
    .join(",");
  await pool.query(
    `INSERT INTO blog_ai_settings (id, enabled, days_of_week, theme)
     VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       enabled = VALUES(enabled),
       days_of_week = VALUES(days_of_week),
       theme = VALUES(theme)`,
    [data.enabled ? 1 : 0, csv, data.theme]
  );
}

export async function recordRun(opts: {
  status: "success" | "skipped" | "error";
  error?: string | null;
}): Promise<void> {
  await pool.query(
    `UPDATE blog_ai_settings
     SET last_run_at = NOW(), last_status = ?, last_error = ?
     WHERE id = 1`,
    [opts.status, opts.error ?? null]
  );
}

export function todayDayCode(date = new Date()): DayCode | null {
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const map: Record<number, DayCode | null> = {
    0: null,
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: null,
  };
  return map[date.getDay()];
}
