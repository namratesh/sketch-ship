import { ShieldAlert, CheckCircle2 } from "lucide-react";
import Spinner from "./Spinner";

interface Props {
  onClick: () => void;
  disabled?: boolean;
  nuking?: boolean;
  alreadyFiled?: boolean;
}

export default function NukeButton({ onClick, disabled, nuking, alreadyFiled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || nuking || alreadyFiled}
      className={`group relative flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl px-6 py-5 font-display text-base font-bold uppercase tracking-[0.14em] transition-all duration-150 disabled:cursor-not-allowed ${
        alreadyFiled
          ? "border border-verdant/40 bg-verdant-wash text-verdant"
          : "bg-crimson text-white shadow-[0_0_0_1px_rgba(251,77,103,0.4),0_8px_30px_-8px_rgba(251,77,103,0.55)] hover:shadow-[0_0_0_1px_rgba(251,77,103,0.5),0_10px_36px_-6px_rgba(251,77,103,0.7)] hover:brightness-110 active:brightness-95"
      } ${nuking ? "animate-nuke-shake" : ""}`}
    >
      {alreadyFiled ? (
        <>
          <CheckCircle2 className="h-5 w-5" /> Takedown Filed
        </>
      ) : nuking ? (
        <>
          <Spinner size={20} />
          Filing on all platforms…
        </>
      ) : (
        <>
          <ShieldAlert className="h-5 w-5" /> File DMCA — Everywhere
        </>
      )}
    </button>
  );
}
