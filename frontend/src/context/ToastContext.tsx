import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function Icon({ kind }: { kind: ToastKind }) {
  switch (kind) {
    case "success":
      return <CheckCircle2 className="h-4 w-4" />;
    case "error":
      return <CircleAlert className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function accentClasses(kind: ToastKind) {
  switch (kind) {
    case "success":
      return "border-l-verdant [&_svg]:text-verdant";
    case "error":
      return "border-l-crimson [&_svg]:text-crimson";
    default:
      return "border-l-violet [&_svg]:text-violet-deep";
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-line border-l-2 bg-card px-4 py-3 shadow-2xl shadow-black/40 ${accentClasses(
              t.kind
            )}`}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <Icon kind={t.kind} />
            </span>
            <p className="text-xs leading-relaxed text-ink">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-auto cursor-pointer text-ink-faint hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}
