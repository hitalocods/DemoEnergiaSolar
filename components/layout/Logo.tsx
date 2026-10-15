import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 shadow-[0_6px_18px_-6px_rgb(29_78_216/0.8)]">
        <Sun className="size-5 text-amber-300" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-400 ring-2 ring-ink" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-extrabold tracking-tight",
          tone === "light" ? "text-white" : "text-slate-900",
        )}
      >
        Solar<span className="text-blue-500">Mais</span>
      </span>
    </span>
  );
}
