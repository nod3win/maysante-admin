"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Globe, Link2, MonitorSmartphone, FileText } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Paire catégorielle validée (CVD + contraste) sur fond blanc.
const COLOR_VISITORS = "#1d4ed8";
const COLOR_PAGEVIEWS = "#b45309";

type StatsRange = 7 | 30 | 90;

interface TopItem {
  label: string;
  count: number;
}

interface Stats {
  days: StatsRange;
  summary: {
    pageviews: number;
    visitors: number;
    bounceRate: number | null;
    avgDurationSeconds: number | null;
  };
  timeseries: { date: string; pageviews: number; visitors: number }[];
  topPages: TopItem[];
  referrers: TopItem[];
  devices: TopItem[];
  browsers: TopItem[];
  countries: TopItem[];
}

const RANGES: { value: StatsRange; label: string }[] = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Ordinateur",
  mobile: "Mobile",
  tablet: "Tablette",
};

const nf = new Intl.NumberFormat("fr-BE");

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatLongDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function StatistiquesPage() {
  const [days, setDays] = useState<StatsRange>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: StatsRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?days=${range}`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const hasData = !!stats && stats.summary.pageviews > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-[#0a0a0a]" />
            <h1 className="text-2xl font-semibold text-[#0a0a0a]">Statistiques</h1>
          </div>
          <p className="text-sm text-[#737373]">
            Fréquentation de maysante.be — mesure anonyme, sans cookies.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-[#e5e5e5] bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === r.value
                  ? "bg-[#0a0a0a] text-white"
                  : "text-[#737373] hover:text-[#0a0a0a]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="text-sm text-[#737373]">Chargement…</div>
      ) : !stats ? (
        <div className="text-sm text-red-600">Impossible de charger les statistiques.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Visiteurs uniques" value={nf.format(stats.summary.visitors)} />
            <StatTile label="Pages vues" value={nf.format(stats.summary.pageviews)} />
            <StatTile
              label="Taux de rebond"
              value={
                stats.summary.bounceRate === null
                  ? "—"
                  : `${Math.round(stats.summary.bounceRate * 100)} %`
              }
            />
            <StatTile
              label="Durée moyenne de visite"
              value={formatDuration(stats.summary.avgDurationSeconds)}
            />
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
            <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">
              Évolution sur {stats.days} jours
            </h2>
            {hasData ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.timeseries}
                    margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 11, fill: "#737373" }}
                      axisLine={{ stroke: "#e5e5e5" }}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#737373" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      labelFormatter={(v) => formatLongDate(String(v))}
                      formatter={(value, name) => [nf.format(Number(value)), String(name)]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e5e5",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      iconType="plainline"
                      wrapperStyle={{ fontSize: 12, color: "#737373" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      name="Visiteurs"
                      stroke={COLOR_VISITORS}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pageviews"
                      name="Pages vues"
                      stroke={COLOR_PAGEVIEWS}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyHint />
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <TopList
              title="Pages les plus vues"
              icon={<FileText className="w-4 h-4" />}
              items={stats.topPages}
            />
            <TopList
              title="Sources de trafic"
              icon={<Link2 className="w-4 h-4" />}
              items={stats.referrers}
              emptyLabel="Uniquement du trafic direct pour l&apos;instant."
            />
            <TopList
              title="Appareils"
              icon={<MonitorSmartphone className="w-4 h-4" />}
              items={stats.devices.map((d) => ({
                ...d,
                label: DEVICE_LABELS[d.label] ?? d.label,
              }))}
            />
            <TopList
              title="Navigateurs"
              icon={<Globe className="w-4 h-4" />}
              items={stats.browsers}
            />
            <TopList
              title="Pays"
              icon={<Globe className="w-4 h-4" />}
              items={stats.countries}
              emptyLabel="Pays indisponible sur cet hébergement."
            />
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
      <p className="text-xs text-[#737373] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-[#0a0a0a] tabular-nums">{value}</p>
    </div>
  );
}

function EmptyHint() {
  return (
    <p className="text-sm text-[#737373] py-8 text-center">
      Aucune visite enregistrée sur cette période. Les données s&apos;accumulent dès que le site
      public reçoit du trafic.
    </p>
  );
}

function TopList({
  title,
  icon,
  items,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: TopItem[];
  emptyLabel?: string;
}) {
  const max = items.length > 0 ? items[0].count : 0;
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
      <h2 className="flex items-center gap-2 text-sm font-medium text-[#0a0a0a] mb-4">
        {icon}
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#737373]">{emptyLabel ?? "Aucune donnée sur cette période."}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="text-sm">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="truncate text-[#0a0a0a]" title={item.label}>
                  {item.label}
                </span>
                <span className="text-[#737373] tabular-nums shrink-0">{nf.format(item.count)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#f3f3f3] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${max > 0 ? Math.max((item.count / max) * 100, 2) : 0}%`,
                    backgroundColor: COLOR_VISITORS,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
