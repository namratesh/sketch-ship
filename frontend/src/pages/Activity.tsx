import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Search,
  Siren,
  FileText,
  Bomb,
  Download,
  Radar,
  ChevronRight,
  ChevronDown,
  ListFilter,
  Check,
} from "lucide-react";
import { getActivity, ApiError, type ActivityLogEntry } from "../lib/api";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import Dropdown from "../components/Dropdown";

const ACTION_META: Record<string, { icon: typeof Upload; label: string; color: string }> = {
  ASSET_UPLOADED: { icon: Upload, label: "Exhibit added", color: "text-violet-deep" },
  SCAN_RUN: { icon: Search, label: "Sweep run", color: "text-azure" },
  INCIDENT_DETECTED: { icon: Siren, label: "Case opened", color: "text-crimson" },
  DMCA_FILED: { icon: FileText, label: "DMCA filed", color: "text-verdant" },
  NUKE_TRIGGERED: { icon: Bomb, label: "Filed everywhere", color: "text-crimson-deep" },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function Activity() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("All");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getActivity()
      .then((list) =>
        setEntries(
          [...list].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        )
      )
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load activity"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const actionOptions = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.action)))],
    [entries]
  );

  const filtered = useMemo(
    () => (actionFilter === "All" ? entries : entries.filter((e) => e.action === actionFilter)),
    [entries, actionFilter]
  );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghosttrace-activity-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-deep">
            Every action, newest first
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-gradient">Activity</h1>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <Dropdown
              trigger={({ open }) => (
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                    actionFilter !== "All"
                      ? "border-violet/40 bg-violet-wash text-violet-deep"
                      : "border-line bg-card text-ink-soft hover:border-ink-faint"
                  }`}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  {actionFilter === "All" ? "All actions" : ACTION_META[actionFilter]?.label ?? actionFilter}
                  <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
              )}
            >
              {(close) => (
                <div className="py-1.5">
                  {actionOptions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setActionFilter(a);
                        close();
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-xs font-medium text-ink-soft transition hover:bg-well hover:text-ink"
                    >
                      {a === "All" ? "All actions" : ACTION_META[a]?.label ?? a}
                      {actionFilter === a && <Check className="h-3.5 w-3.5 text-violet-deep" />}
                    </button>
                  ))}
                </div>
              )}
            </Dropdown>
          )}
          <button
            onClick={exportJson}
            disabled={entries.length === 0}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition hover:border-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Radar />} title="Nothing here yet" subtitle="Actions you take will show up here in real time." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListFilter />}
          title="No activity matches this filter"
          subtitle="Try a different action type."
          action={
            <button
              type="button"
              onClick={() => setActionFilter("All")}
              className="rounded-full bg-violet px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
            >
              Clear filter
            </button>
          }
        />
      ) : (
        <div className="card-surface max-h-[70vh] overflow-y-auto">
          {filtered.map((entry, i) => {
            const meta = ACTION_META[entry.action];
            const Icon = meta?.icon;
            const color = meta?.color ?? "text-ink-soft";
            const label = meta?.label ?? entry.action;
            const day = dayLabel(entry.timestamp);
            const showDayHeader = i === 0 || dayLabel(filtered[i - 1].timestamp) !== day;
            const body = (
              <>
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-well ${color}`}>
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${color}`}>
                      {label}
                    </span>
                    <span className="text-[11px] tabular-nums text-ink-faint">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{entry.details}</p>
                </div>
              </>
            );
            return (
              <div key={entry.id}>
                {showDayHeader && (
                  <div className="sticky top-0 z-10 border-b border-line bg-card/95 px-4 py-1.5 backdrop-blur-sm">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
                      {day}
                    </span>
                  </div>
                )}
                {entry.incident_id ? (
                  <Link
                    to={`/incidents/${entry.incident_id}`}
                    className="group flex items-start gap-3 border-b border-line/60 px-4 py-3 transition hover:bg-well/50"
                  >
                    {body}
                    <ChevronRight className="h-4 w-4 shrink-0 self-center text-ink-faint transition group-hover:text-violet-deep" />
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 border-b border-line/60 px-4 py-3">
                    {body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
