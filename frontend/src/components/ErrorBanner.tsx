import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-crimson/30 bg-crimson-wash px-4 py-3 text-xs text-ink">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-crimson" aria-hidden />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="pill shrink-0 cursor-pointer border-crimson/40 text-crimson transition hover:bg-crimson hover:text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}
