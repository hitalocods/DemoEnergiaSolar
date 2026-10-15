import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-blue-500/30 shadow-md bg-[#021b36]">
        <Image
          src="/ebs-logo.png"
          alt="EBS Energia Solar"
          width={36}
          height={36}
          className="size-full object-cover scale-105"
          priority
        />
      </span>
      <span
        className={cn(
          "font-display text-lg font-extrabold tracking-tight",
          tone === "light" ? "text-white" : "text-slate-900"
        )}
      >
        <span className="text-blue-500">EBS</span>{" "}
        <span>Energia Solar</span>
      </span>
    </span>
  );
}
