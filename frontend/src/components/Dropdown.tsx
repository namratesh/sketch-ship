import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  trigger: (state: { open: boolean }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
  className?: string;
}

/** Generic click-to-open menu: closes on outside click, Escape, or item click. */
export default function Dropdown({
  trigger,
  children,
  align = "right",
  panelClassName = "",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cursor-pointer"
      >
        {trigger({ open })}
      </button>
      {open && (
        <div
          role="menu"
          style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
          className={`animate-dropdown-in absolute top-full z-50 mt-2 min-w-[13rem] overflow-hidden rounded-2xl border border-line bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-md ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
