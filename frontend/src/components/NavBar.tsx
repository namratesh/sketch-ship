import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Ghost, Menu, ChevronDown, UserRound, Activity as ActivityIcon, X, Sun, Moon, LogOut } from "lucide-react";
import { useAppStatus } from "../context/AppStatusContext";
import { useTheme } from "../context/ThemeContext";
import { getProfile, type CreatorProfile } from "../lib/api";
import Dropdown from "./Dropdown";

const LINKS = [
  { to: "/", label: "Overview", end: true },
  { to: "/assets", label: "Exhibits" },
  { to: "/incidents", label: "Cases" },
  { to: "/activity", label: "Activity" },
];

function Tally({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="hidden items-baseline gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint sm:flex">
      <span className="font-mono font-semibold tabular-nums text-ink">
        {typeof value === "number" ? String(value).padStart(2, "0") : value}
      </span>
      <span>{label}</span>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GT";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function NavBar({
  hasProfile,
  onLogout,
}: {
  hasProfile: boolean | null;
  onLogout: () => void;
}) {
  const { stats, backendReachable } = useAppStatus();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!hasProfile) return;
    getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [hasProfile]);

  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-4 sm:gap-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2 text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-wash to-violet/20 text-violet-deep ring-1 ring-inset ring-violet/25">
              <Ghost className="h-4.5 w-4.5 stroke-[1.75]" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              GhostTrace
            </span>
            <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.22em] text-ink-faint lg:inline">
              · Content protection
            </span>
          </NavLink>

          {hasProfile && (
            <nav className="hidden items-center gap-1 sm:flex">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 ${
                      isActive
                        ? "bg-violet-wash text-violet-deep"
                        : "text-ink-faint hover:bg-well hover:text-ink-soft"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Tally label="Exhibits" value={stats?.assets ?? "–"} />
            <Tally label="Cases" value={stats?.incidents ?? "–"} />
            <Tally label="Filed" value={stats?.filed ?? "–"} />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex cursor-pointer items-center justify-center rounded-full border border-line bg-card p-2 text-ink-soft transition hover:border-ink-faint hover:text-ink"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            <div
              title={
                backendReachable === false
                  ? "Backend unreachable"
                  : backendReachable === null
                  ? "Checking backend…"
                  : "Backend connected"
              }
              className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] sm:flex"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  backendReachable === false
                    ? "bg-crimson"
                    : backendReachable === null
                    ? "animate-pulse bg-ink-faint"
                    : "bg-verdant"
                }`}
              />
              <span className="hidden text-ink-soft md:inline">
                {backendReachable === false
                  ? "Offline"
                  : backendReachable === null
                  ? "Connecting"
                  : "Protected"}
              </span>
            </div>

            {hasProfile && (
              <Dropdown
                align="right"
                trigger={({ open }) => (
                  <span className="flex items-center gap-1.5 rounded-full border border-line bg-card py-1 pl-1 pr-2 transition hover:border-ink-faint">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet to-azure text-[10px] font-bold text-white">
                      {initialsOf(profile?.name ?? "")}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </span>
                )}
              >
                {(close) => (
                  <div className="py-1.5">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-xs font-semibold text-ink">
                        {profile?.name || "Creator"}
                      </p>
                      <p className="truncate text-[11px] text-ink-faint">{profile?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        navigate("/onboarding");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-ink-soft transition hover:bg-well hover:text-ink"
                    >
                      <UserRound className="h-3.5 w-3.5" /> Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        navigate("/activity");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-ink-soft transition hover:bg-well hover:text-ink"
                    >
                      <ActivityIcon className="h-3.5 w-3.5" /> Full activity log
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        onLogout();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-crimson transition hover:bg-crimson-wash"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Log out
                    </button>
                  </div>
                )}
              </Dropdown>
            )}

            {hasProfile && (
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
                className="flex cursor-pointer items-center justify-center rounded-full border border-line bg-card p-2 text-ink-soft transition hover:border-ink-faint sm:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {hasProfile && mobileOpen && (
          <nav className="animate-dropdown-in mb-3 grid gap-1 rounded-2xl border border-line bg-card p-2 sm:hidden">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    isActive
                      ? "bg-violet-wash text-violet-deep"
                      : "text-ink-faint hover:bg-well hover:text-ink-soft"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
