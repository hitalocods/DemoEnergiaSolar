import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

export type NavVariant = "sidebar" | "bottom";

/**
 * Visual puro dos links de navegação. Recebe o pathname de fora, para poder ser
 * usado tanto no fallback estático (sem pathname) quanto na versão ativa.
 */
export function NavLinksView({
  variant,
  pathname,
  badges = {},
}: {
  variant: NavVariant;
  pathname: string | null;
  badges?: Record<string, number>;
}) {
  const isActive = (href: string) => !!pathname && (pathname === href || pathname.startsWith(`${href}/`));

  if (variant === "bottom") {
    return (
      <ul className="grid grid-cols-7">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  active ? "text-brand" : "text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-blue-50",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                {short}
                {href === "/configuracoes" && (
                  <span className="absolute right-[calc(50%-20px)] top-1 flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                {!!badges[href] && (
                  <span className="absolute right-[calc(50%-22px)] top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              )}
            >
              {active && <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />}
              <Icon
                className={cn("size-[18px] transition-colors", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")}
              />
              <span className="flex-1">{label}</span>
              {href === "/configuracoes" && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
              )}
              {!!badges[href] && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white tabular">
                  {badges[href]}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
