import pool from "./db";
import type { RowDataPacket } from "mysql2";

/**
 * Requêtes d'agrégation sur `analytics_events` (analytics maison, alimentée
 * par le site public via /api/track). Un "visiteur" est un hash anonyme à
 * rotation quotidienne : les visiteurs uniques s'entendent donc par jour,
 * et une "visite" correspond à un visiteur-jour.
 */

export type StatsRange = 7 | 30 | 90;

export interface StatsSummary {
  pageviews: number;
  visitors: number;
  bounceRate: number | null; // 0..1
  avgDurationSeconds: number | null;
}

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  pageviews: number;
  visitors: number;
}

export interface TopItem {
  label: string;
  count: number;
}

export interface Stats {
  days: StatsRange;
  summary: StatsSummary;
  timeseries: TimeseriesPoint[];
  topPages: TopItem[];
  referrers: TopItem[];
  devices: TopItem[];
  browsers: TopItem[];
  countries: TopItem[];
}

function sinceDate(days: StatsRange): Date {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  return since;
}

async function topBy(column: string, since: Date, opts?: { notNull?: boolean }): Promise<TopItem[]> {
  const notNull = opts?.notNull ? `AND ${column} IS NOT NULL` : "";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${column} AS label, COUNT(*) AS count
     FROM analytics_events
     WHERE created_at >= ? ${notNull}
     GROUP BY ${column}
     ORDER BY count DESC
     LIMIT 10`,
    [since],
  );
  return (rows as { label: string | null; count: number }[])
    .filter((r): r is TopItem => r.label !== null)
    .map((r) => ({ label: String(r.label), count: Number(r.count) }));
}

export async function getStats(days: StatsRange): Promise<Stats> {
  const since = sinceDate(days);

  const [summaryRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS pageviews, COUNT(DISTINCT visitor_hash) AS visitors
     FROM analytics_events WHERE created_at >= ?`,
    [since],
  );
  const base = summaryRows[0] as { pageviews: number; visitors: number };

  // Par visiteur-jour : rebond = une seule page vue ; durée = écart entre
  // le premier et le dernier événement de la visite.
  const [visitRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS visits,
            SUM(views = 1) AS bounces,
            AVG(duration) AS avg_duration
     FROM (
       SELECT visitor_hash,
              COUNT(*) AS views,
              TIMESTAMPDIFF(SECOND, MIN(created_at), MAX(created_at)) AS duration
       FROM analytics_events
       WHERE created_at >= ?
       GROUP BY visitor_hash, DATE(created_at)
     ) AS visits`,
    [since],
  );
  const visits = visitRows[0] as {
    visits: number;
    bounces: number | null;
    avg_duration: number | null;
  };

  const [seriesRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d,
            COUNT(*) AS pageviews,
            COUNT(DISTINCT visitor_hash) AS visitors
     FROM analytics_events
     WHERE created_at >= ?
     GROUP BY d
     ORDER BY d`,
    [since],
  );
  const byDay = new Map(
    (seriesRows as { d: string; pageviews: number; visitors: number }[]).map((r) => [
      r.d,
      { pageviews: Number(r.pageviews), visitors: Number(r.visitors) },
    ]),
  );

  // Série complète, jours vides inclus.
  const timeseries: TimeseriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const point = byDay.get(key);
    timeseries.push({
      date: key,
      pageviews: point?.pageviews ?? 0,
      visitors: point?.visitors ?? 0,
    });
  }

  const [topPages, referrers, devices, browsers, countries] = await Promise.all([
    topBy("path", since),
    topBy("referrer_domain", since, { notNull: true }),
    topBy("device", since),
    topBy("browser", since, { notNull: true }),
    topBy("country", since, { notNull: true }),
  ]);

  const totalVisits = Number(visits.visits ?? 0);
  return {
    days,
    summary: {
      pageviews: Number(base.pageviews),
      visitors: Number(base.visitors),
      bounceRate: totalVisits > 0 ? Number(visits.bounces ?? 0) / totalVisits : null,
      avgDurationSeconds: visits.avg_duration !== null ? Number(visits.avg_duration) : null,
    },
    timeseries,
    topPages,
    referrers,
    devices,
    browsers,
    countries,
  };
}
