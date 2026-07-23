import pool from "./db";
import type { RowDataPacket } from "mysql2";

export type RunStatus = "running" | "success" | "error";

export interface BlogAiSettings {
  theme: string | null;
  auto_publish: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

export async function getSettings(): Promise<BlogAiSettings> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT theme, auto_publish, last_run_at, last_status, last_error FROM blog_ai_settings WHERE id = 1"
  );
  const row = rows[0];
  if (!row) {
    return {
      theme: null,
      auto_publish: false,
      last_run_at: null,
      last_status: null,
      last_error: null,
    };
  }
  return {
    theme: row.theme ?? null,
    auto_publish: row.auto_publish === 1,
    last_run_at: row.last_run_at,
    last_status: row.last_status,
    last_error: row.last_error,
  };
}

export async function saveSettings(data: {
  theme: string | null;
  auto_publish: boolean;
}): Promise<void> {
  await pool.query(
    `INSERT INTO blog_ai_settings (id, theme, auto_publish)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE
       theme = VALUES(theme),
       auto_publish = VALUES(auto_publish)`,
    [data.theme, data.auto_publish ? 1 : 0]
  );
}

// Marque une génération en cours : la page Génération IA sonde ce statut
// pour afficher la progression pendant que la requête POST tourne.
export async function markRunning(): Promise<void> {
  await pool.query(
    `UPDATE blog_ai_settings
     SET last_run_at = NOW(), last_status = 'running', last_error = NULL
     WHERE id = 1`
  );
}

export async function recordRun(opts: {
  status: Exclude<RunStatus, "running">;
  error?: string | null;
}): Promise<void> {
  await pool.query(
    `UPDATE blog_ai_settings
     SET last_run_at = NOW(), last_status = ?, last_error = ?
     WHERE id = 1`,
    [opts.status, opts.error ?? null]
  );
}
