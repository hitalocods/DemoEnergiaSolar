import { BarChart3, KanbanSquare, LayoutDashboard, MessageSquare, Settings, Smartphone, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string; // rótulo curto para o menu inferior (mobile)
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Início", icon: LayoutDashboard },
  { href: "/conversas", label: "Conversas", short: "Chat", icon: MessageSquare },
  { href: "/leads", label: "Leads", short: "Leads", icon: Users },
  { href: "/vendas", label: "Vendas", short: "Vendas", icon: KanbanSquare },
  { href: "/relatorios", label: "Relatórios", short: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", short: "Ajustes", icon: Settings },
  { href: "/demo", label: "Simulador", short: "Simulador", icon: Smartphone },
];
