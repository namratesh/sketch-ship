import { Hourglass } from "lucide-react";
import PlatformBadge from "./PlatformBadge";

interface Props {
  platform: string;
  filed: boolean;
  justFiled?: boolean;
  filedAt?: string;
  delayMs?: number;
}

export default function PlatformFlipCard({ platform, filed, justFiled, filedAt, delayMs = 0 }: Props) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center transition-colors duration-300 ${
        filed ? "border-verdant/40 bg-verdant-wash/60" : "border-line bg-card"
      }`}
    >
      <div className="flex flex-col items-center gap-2.5">
        <PlatformBadge platform={platform} />
        {filed ? (
          <>
            <span
              className={`pill bg-verdant-wash text-sm text-verdant ${justFiled ? "animate-stamp-in" : ""}`}
              style={justFiled ? { animationDelay: `${delayMs}ms` } : undefined}
            >
              Filed
            </span>
            {filedAt && (
              <p className="text-[10px] tabular-nums text-ink-faint">
                {new Date(filedAt).toLocaleTimeString()}
              </p>
            )}
          </>
        ) : (
          <>
            <Hourglass className="h-5 w-5 text-ink-faint" />
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">
              Awaiting filing
            </p>
          </>
        )}
      </div>
    </div>
  );
}
