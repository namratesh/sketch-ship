import { useState, type FormEvent } from "react";
import { Ghost, Lock } from "lucide-react";

const DEMO_USERNAME = "demo_user";
const DEMO_PASSWORD = "demo_password";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setError(null);
      onLogin();
      return;
    }
    setError("Invalid username or password.");
  };

  const fillDemo = () => {
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-wash text-violet-deep">
          <Ghost className="h-7 w-7 stroke-[1.5]" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-deep">
          Sign in
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-gradient">
          Welcome to GhostTrace
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-ink-soft">
          Demo credentials are pre-filled below — just hit sign in.
        </p>
      </div>

      <form onSubmit={submit} className="card-surface space-y-5 p-6">
        {error && (
          <div className="rounded-xl border border-crimson/30 bg-crimson-wash px-3 py-2 text-xs text-ink">
            {error}
          </div>
        )}

        <Field label="Username">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="demo_user"
            autoComplete="username"
            className={inputClass}
          />
        </Field>

        <Field label="Password">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo_password"
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-paper shadow-[0_8px_24px_-8px_rgba(139,107,242,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(139,107,242,0.65)]"
          >
            <Lock className="h-3.5 w-3.5" />
            Sign in
          </button>
          <button
            type="button"
            onClick={fillDemo}
            className="shrink-0 cursor-pointer rounded-full border border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft transition hover:border-ink-faint hover:text-ink"
          >
            Use demo login
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-well px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
