import type { ReactNode } from "react";
import { Ghost } from "lucide-react";

interface Props {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/40 px-6 py-16 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-wash text-violet-deep [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-[1.5]">
        {icon ?? <Ghost />}
      </span>
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink-soft">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
