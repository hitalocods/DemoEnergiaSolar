"use client";

import { usePathname } from "next/navigation";
import { NavLinksView, type NavVariant } from "./NavLinksView";

/** Links com estado ativo + contador de leads aguardando humano. */
export function NavLinks({
  variant,
  pendingCount = 0,
}: {
  variant: NavVariant;
  pendingCount?: number;
}) {
  const pathname = usePathname();

  return (
    <NavLinksView
      variant={variant}
      pathname={pathname}
      badges={{ "/leads": pendingCount }}
    />
  );
}
