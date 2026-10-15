import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
];

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
};

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide",
        SIZES[size],
        colorFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
