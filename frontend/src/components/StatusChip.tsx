interface Props {
  status: string;
}

const STYLES: Record<string, string> = {
  DETECTED: "text-crimson bg-crimson-wash",
  FILED: "text-azure bg-azure-wash",
  IN_REVIEW: "text-brass bg-brass-wash",
  RESOLVED: "text-verdant bg-verdant-wash",
  FAILED: "text-crimson-deep bg-crimson-wash",
};

export default function StatusChip({ status }: Props) {
  const style = STYLES[status] ?? "text-ink-soft bg-well";
  const isDetected = status === "DETECTED";
  return (
    <span className={`pill ${style}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full bg-current ${isDetected ? "animate-pulse" : ""}`}
      />
      {status.replace("_", " ")}
    </span>
  );
}
