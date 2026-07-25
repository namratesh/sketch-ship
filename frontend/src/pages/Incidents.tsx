import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ScanSearch,
  ExternalLink,
  ImageOff,
  ListFilter,
  Check,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { getIncidents, seedLeakUrl, ApiError, type Incident } from "../lib/api";
import PlatformBadge from "../components/PlatformBadge";
import GoogleVisionBadge from "../components/GoogleVisionBadge";
import StatusChip from "../components/StatusChip";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import ScoreRing from "../components/ScoreRing";
import Dropdown from "../components/Dropdown";
import { caseNo, formatDate } from "../lib/format";

const STATUS_FILTERS = ["All", "DETECTED", "FILED", "IN_REVIEW", "RESOLVED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function ChevronDownMini({ open }: { open: boolean }) {
  return (
    <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
  );
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const assetFilter = searchParams.get("asset");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getIncidents()
      .then((list) =>
        setIncidents(
          [...list].sort(
            (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
          )
        )
      )
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load incidents"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const platformOptions = useMemo(
    () => ["All", ...Array.from(new Set(incidents.map((i) => i.platform)))],
    [incidents]
  );

  const filtered = useMemo(
    () =>
      incidents.filter(
        (i) =>
          (statusFilter === "All" || i.status === statusFilter) &&
          (platformFilter === "All" || i.platform === platformFilter) &&
          (!assetFilter || i.asset_id === assetFilter)
      ),
    [incidents, statusFilter, platformFilter, assetFilter]
  );

  const filtersActive = statusFilter !== "All" || platformFilter !== "All" || !!assetFilter;

  // Multiple incidents can point at the same leaked asset (one leak found on
  // several platforms, or the same URL re-detected) -- group those into a
  // single case card instead of listing each match as its own row.
  const groups = useMemo(() => {
    const byAsset = new Map<string, Incident[]>();
    filtered.forEach((incident) => {
      const list = byAsset.get(incident.asset_id);
      if (list) list.push(incident);
      else byAsset.set(incident.asset_id, [incident]);
    });
    return Array.from(byAsset.values())
      .map((list) => {
        const matches = [...list].sort((a, b) => b.similarity_score - a.similarity_score);
        const latestDetectedAt = list.reduce(
          (latest, i) => (new Date(i.detected_at) > new Date(latest) ? i.detected_at : latest),
          list[0].detected_at
        );
        return { assetId: list[0].asset_id, matches, latestDetectedAt };
      })
      .sort((a, b) => new Date(b.latestDetectedAt).getTime() - new Date(a.latestDetectedAt).getTime());
  }, [filtered]);

  const clearAssetFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("asset");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-deep">
            Infringement matters, newest first
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-gradient">Open Cases</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-ink-soft">
            Leaked or re-uploaded copies of your work, detected by Gemini vision and real
            Google web searches. Each case carries the evidence needed to file.
          </p>
        </div>

        {incidents.length > 0 && (
          <div className="flex items-center gap-2">
            <Dropdown
              trigger={({ open }) => (
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                    statusFilter !== "All"
                      ? "border-violet/40 bg-violet-wash text-violet-deep"
                      : "border-line bg-card text-ink-soft hover:border-ink-faint"
                  }`}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  {statusFilter === "All" ? "Status" : statusFilter.replace("_", " ")}
                  <ChevronDownMini open={open} />
                </span>
              )}
            >
              {(close) => (
                <div className="py-1.5">
                  {STATUS_FILTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStatusFilter(s);
                        close();
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-xs font-medium text-ink-soft transition hover:bg-well hover:text-ink"
                    >
                      {s === "All" ? "All statuses" : s.replace("_", " ")}
                      {statusFilter === s && <Check className="h-3.5 w-3.5 text-violet-deep" />}
                    </button>
                  ))}
                </div>
              )}
            </Dropdown>

            <Dropdown
              trigger={({ open }) => (
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                    platformFilter !== "All"
                      ? "border-violet/40 bg-violet-wash text-violet-deep"
                      : "border-line bg-card text-ink-soft hover:border-ink-faint"
                  }`}
                >
                  {platformFilter === "All" ? "Platform" : platformFilter}
                  <ChevronDownMini open={open} />
                </span>
              )}
            >
              {(close) => (
                <div className="py-1.5">
                  {platformOptions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlatformFilter(p);
                        close();
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-xs font-medium text-ink-soft transition hover:bg-well hover:text-ink"
                    >
                      {p === "All" ? "All platforms" : p}
                      {platformFilter === p && <Check className="h-3.5 w-3.5 text-violet-deep" />}
                    </button>
                  ))}
                </div>
              )}
            </Dropdown>
          </div>
        )}
      </div>

      {assetFilter && !loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet/25 bg-violet-wash/40 px-4 py-3">
          <p className="text-xs text-ink">
            Showing{" "}
            <span className="font-semibold text-violet-deep">
              {filtered.length} match{filtered.length === 1 ? "" : "es"}
            </span>{" "}
            found for this exhibit, all in one place.
          </p>
          <button
            type="button"
            onClick={clearAssetFilter}
            className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-deep hover:text-violet"
          >
            <X className="h-3 w-3" />
            Show all cases
          </button>
        </div>
      )}

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={<ScanSearch />}
          title="No cases open"
          subtitle="Run a sweep from Overview to compare your exhibits against the monitored web."
          action={
            <Link
              to="/"
              className="rounded-full bg-violet px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
            >
              Go to Overview
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListFilter />}
          title="No cases match these filters"
          subtitle="Try a different status or platform."
          action={
            filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("All");
                  setPlatformFilter("All");
                  clearAssetFilter();
                }}
                className="rounded-full bg-violet px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => {
            const top = group.matches[0];
            const isBroken = brokenImages.has(top.id);
            const anyDetected = group.matches.some((i) => i.status === "DETECTED");
            return (
              <li
                key={group.assetId}
                className={`card-surface p-3 ${anyDetected ? "animate-ghost-pulse" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-well">
                    {isBroken ? (
                      <div className="flex h-full w-full items-center justify-center text-ink-faint">
                        <ImageOff className="h-5 w-5 stroke-[1.5]" />
                      </div>
                    ) : (
                      <img
                        src={seedLeakUrl(top.leak_image_path)}
                        alt="Leaked copy"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={() => setBrokenImages((prev) => new Set(prev).add(top.id))}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-ink">
                        Case {caseNo(group.assetId)}
                      </span>
                      <span className="pill bg-well text-ink-soft">
                        {group.matches.length} match{group.matches.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    <p className="truncate text-sm italic text-ink-soft">“{top.reasoning}”</p>
                    <p className="mt-1 text-[11px] tabular-nums text-ink-faint">
                      Detected {formatDate(group.latestDetectedAt)}
                    </p>
                  </div>

                  <ScoreRing score={top.similarity_score} size={56} strokeWidth={5} caption="top match" />
                </div>

                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {group.matches.map((incident) => (
                    <li key={incident.id}>
                      <Link
                        to={`/incidents/${incident.id}`}
                        className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition hover:bg-well/60"
                      >
                        <PlatformBadge platform={incident.platform} size="sm" />
                        {incident.source === "GOOGLE_VISION" && <GoogleVisionBadge size="sm" />}
                        {/* not an <a>: anchors can't nest inside the row's Link */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(incident.leak_url, "_blank", "noopener,noreferrer");
                          }}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 truncate text-left text-[11px] text-ink-faint hover:text-violet-deep hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{incident.leak_url}</span>
                        </button>
                        <StatusChip status={incident.status} />
                        <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-soft">
                          {incident.similarity_score}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
