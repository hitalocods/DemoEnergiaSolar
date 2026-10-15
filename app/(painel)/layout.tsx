import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav, Topbar } from "@/components/layout/Topbar";
import { requireSessionUser } from "@/lib/auth";
import { getLeads } from "@/lib/data";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();
  const allLeads = await getLeads();
  const pendingCount = allLeads.filter(
    (l) => l.attendance === "ia" && l.status === "quente"
  ).length;

  return (
    <>
      <Sidebar user={user} pendingCount={pendingCount} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Topbar user={user} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>
      <BottomNav pendingCount={pendingCount} />
    </>
  );
}
