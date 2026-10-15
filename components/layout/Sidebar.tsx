import { Suspense } from "react";
import Link from "next/link";
import { Bot, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { NavLinksView } from "./NavLinksView";

/** Sidebar escura fixa (desktop) com logout funcional. */
export function Sidebar({
  user,
  pendingCount = 0,
}: {
  user?: SessionUser | null;
  pendingCount?: number;
}) {
  const displayName = user?.nome || "Rafael Nunes";
  const displayRole = user?.cargo || "Consultor comercial";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink px-4 py-6 lg:flex">
      <Link href="/dashboard" className="px-2">
        <Logo />
      </Link>

      <p className="mb-2 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Menu
      </p>
      <nav aria-label="Navegação principal">
        <Suspense fallback={<NavLinksView variant="sidebar" pathname={null} />}>
          <NavLinks variant="sidebar" pendingCount={pendingCount} />
        </Suspense>
      </nav>

      <div className="mt-auto space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/25 to-blue-500/5 p-4 ring-1 ring-inset ring-white/10">
          <div className="absolute -right-6 -top-6 size-20 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <Bot className="size-4 text-blue-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Assistente IA</p>
              <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                Atendendo 24h
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Qualifica leads no WhatsApp e passa para você quando estiverem prontos.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Avatar name={displayName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500">{displayRole}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              id="botao-logout"
              aria-label="Sair da conta"
              title="Sair da conta"
              className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-red-400"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
