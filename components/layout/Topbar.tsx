import { Suspense } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { BotaoInstalarApp } from "@/components/pwa/BotaoInstalarApp";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { NavLinksView } from "./NavLinksView";

/** Barra superior: compacta e escura no mobile, clara com busca no desktop. */
export function Topbar({ user }: { user?: SessionUser | null }) {
  const displayName = user?.nome || "Samuel";

  return (
    <header className="sticky top-0 z-20">
      {/* Mobile */}
      <div className="flex h-14 items-center justify-between bg-ink px-4 lg:hidden">
        <Link href="/dashboard">
          <Logo className="scale-90 origin-left" />
        </Link>
        <div className="flex items-center gap-2">
          <BotaoInstalarApp className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm" />
          <Link href="/dashboard" aria-label="Conta">
            <Avatar name={displayName} size="sm" />
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden h-16 items-center gap-4 border-b border-slate-200/70 bg-canvas/80 px-8 backdrop-blur-xl lg:flex">
        <label className="relative w-full max-w-sm">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="busca-global"
            type="search"
            placeholder="Buscar lead, cidade ou telefone…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="ml-auto flex items-center gap-3">
          <BotaoInstalarApp />
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 xl:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            WhatsApp conectado
          </span>
          <button
            aria-label="Notificações"
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-slate-800"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-500 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
}

/** Menu inferior fixo (mobile). */
export function BottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <Suspense fallback={<NavLinksView variant="bottom" pathname={null} />}>
        <NavLinks variant="bottom" pendingCount={pendingCount} />
      </Suspense>
    </nav>
  );
}
