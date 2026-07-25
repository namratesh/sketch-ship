import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Search, Siren, FileText, Bomb, Image, CheckCircle2, Radar } from "lucide-react";
import {
  postScan,
  getActivity,
  ApiError,
  type ActivityLogEntry,
} from "../lib/api";
import { useAppStatus } from "../context/AppStatusContext";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import { timeAgo } from "../lib/format";

const ACTION_ICON: Record<string, typeof Upload> = {
  ASSET_UPLOADED: Upload,
  SCAN_RUN: Search,
  INCIDENT_DETECTED: Siren,
  DMCA_FILED: FileText,
  NUKE_TRIGGERED: Bomb,
};

export default function Dashboard() {
  const { stats, statsLoading, refreshStats } = useAppStatus();
  const { showToast } = useToast();
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadActivity = useCallback(() => {
    setActivityLoading(true);
    setActivityError(null);
    getActivity()
      .then((entries) => setActivity(entries.slice(0, 6)))
      .catch((err) =>
        setActivityError(err instanceof ApiError ? err.message : "Failed to load activity")
      )
      .finally(() => setActivityLoading(false));
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const runScan = async () => {
    setScanning(true);
    try {
      const result = await postScan();
      const n = result.new_incidents.length;
      showToast(
        n > 0
          ? `Scan complete — ${n} new case${n === 1 ? "" : "s"} opened.`
          : "Scan complete — no new infringements found.",
        n > 0 ? "success" : "info"
      );
      await Promise.all([refreshStats(), loadActivity()]);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Scan failed — try again.",
        "error"
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-deep">
              Protection status ·{" "}
              {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
            </p>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">
              Your content, watched.
            </h1>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-paper shadow-[0_8px_24px_-8px_rgba(139,107,242,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(139,107,242,0.65)] active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
          >
            {scanning ? <Spinner size={16} /> : <Search className="h-4 w-4" />}
            {scanning ? "Sweeping for leaks…" : "Run Sweep"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Exhibits on file" value={stats?.assets ?? 0} accent="violet" icon={<Image />} loading={statsLoading} />
          <StatCard label="Open cases" value={stats?.incidents ?? 0} accent="red" icon={<Siren />} loading={statsLoading} />
          <StatCard label="Notices filed" value={stats?.filed ?? 0} accent="amber" icon={<FileText />} loading={statsLoading} />
          <StatCard label="Resolved" value={stats?.resolved ?? 0} accent="emerald" icon={<CheckCircle2 />} loading={statsLoading} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Recent activity</h2>
          <Link
            to="/activity"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-deep hover:text-violet"
          >
            View all →
          </Link>
        </div>

        {activityError ? (
          <ErrorBanner message={activityError} onRetry={loadActivity} />
        ) : activityLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <EmptyState
            icon={<Radar />}
            title="Nothing here yet"
            subtitle="Submit an exhibit and run a sweep to start watching for leaks."
            action={
              <Link
                to="/assets"
                className="rounded-full bg-violet px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
              >
                Submit your first exhibit
              </Link>
            }
          />
        ) : (
          <div className="card-surface divide-y divide-line/60 overflow-hidden">
            {activity.map((entry) => {
              const Icon = ACTION_ICON[entry.action];
              const iconEl = Icon ? (
                <Icon className="h-4 w-4 shrink-0 text-ink-faint" />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
              );
              const row = (
                <>
                  {iconEl}
                  <span className="flex-1 truncate text-xs text-ink-soft">{entry.details}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
                    {timeAgo(entry.timestamp)}
                  </span>
                </>
              );
              return entry.incident_id ? (
                <Link
                  key={entry.id}
                  to={`/incidents/${entry.incident_id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-well/60"
                >
                  {row}
                </Link>
              ) : (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  {row}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
