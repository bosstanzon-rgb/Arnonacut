import type { ImportanceLevel } from "@/lib/types";

const STYLES: Record<ImportanceLevel, string> = {
  BREAKING: "bg-red-600 text-white",
  MAJOR: "bg-orange-500 text-white",
  UPDATE: "bg-amber-300 text-stone-900",
  OTHER: "bg-stone-200 text-stone-600",
};

export function ImportanceBadge({
  level,
  className = "",
}: {
  level: ImportanceLevel;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] ${STYLES[level]} ${className}`}
    >
      {level}
    </span>
  );
}
