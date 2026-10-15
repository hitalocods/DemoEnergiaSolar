import type { LeadStatus } from "@/lib/types";
import { cn, STATUS_META } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        meta.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
