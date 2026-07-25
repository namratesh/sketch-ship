import { useState, type FormEvent } from "react";
import { Ghost } from "lucide-react";
import { postProfile, ApiError, type CreatorProfile } from "../lib/api";
import { useToast } from "../context/ToastContext";
import Spinner from "../components/Spinner";

const DEMO_PROFILE: CreatorProfile = {
  name: "Jordan Vale",
  email: "jordan.vale@creatormail.com",
  address: "221B Creator Lane, Los Angeles, CA 90028, USA",
  phone: "+1 (555) 019-4477",
};

interface Props {
  onDone: () => void;
}

export default function Onboarding({ onDone }: Props) {
  const [form, setForm] = useState<CreatorProfile>({
    name: "",
    email: "",
    address: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const update = (field: keyof CreatorProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postProfile(form);
      showToast(`Welcome, ${form.name.split(" ")[0] || "creator"} — GhostTrace has your back.`, "success");
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => setForm(DEMO_PROFILE);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-wash text-violet-deep">
          <Ghost className="h-7 w-7 stroke-[1.5]" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-deep">
          Set up your profile
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-gradient">
          Who are we protecting?
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-ink-soft">
          Tell us who you are so we can file DMCA takedowns on your behalf. This
          info goes straight into the notices we generate — no account, no password.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="card-surface space-y-5 p-6"
      >
        {error && (
          <div className="rounded-xl border border-crimson/30 bg-crimson-wash px-3 py-2 text-xs text-ink">
            {error}
          </div>
        )}

        <Field label="Full legal name" required>
          <input
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Jordan Vale"
            className={inputClass}
          />
        </Field>

        <Field label="Email" required>
          <input
            required
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="jordan@creatormail.com"
            className={inputClass}
          />
        </Field>

        <Field label="Mailing address" required>
          <input
            required
            value={form.address}
            onChange={update("address")}
            placeholder="221B Creator Lane, Los Angeles, CA"
            className={inputClass}
          />
        </Field>

        <Field label="Phone" required>
          <input
            required
            value={form.phone}
            onChange={update("phone")}
            placeholder="+1 (555) 019-4477"
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-paper shadow-[0_8px_24px_-8px_rgba(139,107,242,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(139,107,242,0.65)] disabled:opacity-60"
          >
            {submitting && <Spinner size={14} />}
            {submitting ? "Setting up…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={fillDemo}
            className="shrink-0 cursor-pointer rounded-full border border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft transition hover:border-ink-faint hover:text-ink"
          >
            Use demo profile
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-well px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        {label}
        {required && <span className="text-crimson"> *</span>}
      </span>
      {children}
    </label>
  );
}
