import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "whatsapp" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_6px_16px_-6px_rgb(29_78_216/0.55)] hover:bg-brand-dark active:translate-y-px disabled:bg-blue-300 disabled:shadow-none",
  whatsapp:
    "bg-whats text-white shadow-[0_6px_16px_-6px_rgb(22_163_74/0.55)] hover:bg-green-700 active:translate-y-px",
  secondary:
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
};

const base =
  "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  );
}

/** Mesmo visual do Button, mas como link (interno via next/link ou externo). */
export function ButtonLink({
  href,
  external,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & { href: string; external?: boolean } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  const classes = cn(base, VARIANTS[variant], SIZES[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
