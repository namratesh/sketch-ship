import { useState } from "react";
import { Check, Copy } from "lucide-react";
import Spinner from "./Spinner";

interface Props {
  platform: string;
  status: "idle" | "loading" | "preview" | "filed" | "error";
  noticeText?: string;
  filedAt?: string;
  errorMessage?: string;
  onGenerate: () => void;
}

export default function DmcaPreview({
  platform,
  status,
  noticeText,
  filedAt,
  errorMessage,
  onGenerate,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!noticeText) return;
    try {
      await navigator.clipboard.writeText(noticeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — ignore silently, this is a demo nicety
    }
  };

  return (
    <div className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink">
          DMCA Notice — {platform}
        </p>
        {status === "filed" && (
          <span className="pill animate-stamp-in bg-verdant-wash text-verdant">
            Filed{filedAt ? ` · ${new Date(filedAt).toLocaleTimeString()}` : ""}
          </span>
        )}
        {status === "preview" && (
          <span className="pill bg-brass-wash text-brass">Draft — not filed</span>
        )}
      </div>

      {status === "idle" && (
        <button
          onClick={onGenerate}
          className="w-full cursor-pointer rounded-xl border border-violet/40 bg-violet-wash px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-deep transition hover:bg-violet hover:text-white"
        >
          Draft DMCA notice for {platform}
        </button>
      )}

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-ink-soft">
          <Spinner size={18} />
          Drafting notice with Gemini…
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-xs text-crimson">{errorMessage ?? "Could not generate preview."}</p>
          <button
            onClick={onGenerate}
            className="pill cursor-pointer border-crimson/40 text-crimson transition hover:bg-crimson hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {(status === "preview" || status === "filed") && noticeText && (
        <div className="relative">
          <div className="relative max-h-80 overflow-auto rounded-xl border border-line bg-well">
            <span className="pointer-events-none absolute inset-y-0 left-9 w-px bg-violet/25" />
            <pre className="whitespace-pre-wrap py-4 pl-14 pr-6 font-mono text-xs leading-relaxed text-ink-soft">
              {noticeText}
            </pre>
            {status === "filed" && (
              <span className="pill pointer-events-none absolute right-3 top-3 bg-verdant-wash text-verdant">
                Filed
              </span>
            )}
          </div>
          <button
            onClick={copy}
            className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft shadow-lg transition hover:border-ink-faint hover:text-ink"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-verdant" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
