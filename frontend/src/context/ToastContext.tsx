import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, CircleAlert, Info, X, ArrowRight } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

export interface ToastOptions {
  /** In-app route to navigate to when the toast body is clicked. */
  to?: string;
}

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  to?: string;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind, options?: ToastOptions) => void;
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
  const navigate = useNavigate();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info", options?: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, kind, message, to: options?.to }]);
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
            {t.to ? (
              <button
                type="button"
                onClick={() => {
                  dismiss(t.id);
                  navigate(t.to!);
                }}
                className="group flex flex-1 cursor-pointer items-center gap-1.5 text-left"
              >
                <p className="text-xs leading-relaxed text-ink underline-offset-2 group-hover:underline">
                  {t.message}
                </p>
                <ArrowRight className="h-3 w-3 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-violet-deep" />
              </button>
            ) : (
              <p className="flex-1 text-xs leading-relaxed text-ink">{t.message}</p>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="ml-auto shrink-0 cursor-pointer text-ink-faint hover:text-ink"
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
