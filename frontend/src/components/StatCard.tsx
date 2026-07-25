import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  label: string;
  value: number | string;
  accent?: "violet" | "amber" | "emerald" | "red";
  icon?: ReactNode;
  loading?: boolean;
}

const ACCENTS: Record<string, string> = {
  violet: "bg-violet text-violet",
  amber: "bg-brass text-brass",
  emerald: "bg-verdant text-verdant",
  red: "bg-crimson text-crimson",
};

const ACCENT_WASH: Record<string, string> = {
  violet: "bg-violet-wash text-violet-deep",
  amber: "bg-brass-wash text-brass",
  emerald: "bg-verdant-wash text-verdant",
  red: "bg-crimson-wash text-crimson",
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(value: number | string, durationMs = 700): number | string {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplay(value);
      return;
    }
    const from = typeof fromRef.current === "number" ? fromRef.current : 0;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const current = Math.round(from + (value - from) * easeOutCubic(t));
      setDisplay(current);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

export default function StatCard({
  label,
  value,
  accent = "violet",
  icon,
  loading,
}: Props) {
  const display = useCountUp(value);

  return (
    <div className="card-surface p-5 transition-colors hover:border-line/80">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          {label}
        </p>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-full [&>svg]:h-3.5 [&>svg]:w-3.5 ${ACCENT_WASH[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-4xl font-bold tabular-nums text-ink">
        {loading ? (
          <span className="skeleton inline-block h-9 w-14 align-middle" />
        ) : (
          display
        )}
      </p>
      <span className={`mt-3 block h-1 w-8 rounded-full opacity-70 ${ACCENTS[accent].split(" ")[0]}`} />
    </div>
  );
}
