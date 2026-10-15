import type { Metadata } from "next";
import { BarChart3, CalendarRange, Download, MapPinned, Megaphone, Timer, Users } from "lucide-react";
import { ComingSoon } from "@/components/placeholder/ComingSoon";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Relatórios de desempenho de atendimento, campanhas e vendas.",
};

const BARS = [38, 52, 44, 68, 59, 82, 74, 91, 66, 88, 97, 79];

export default function RelatoriosPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      eyebrow="Relatórios"
      title="Entenda de onde vêm suas vendas"
      description="Compare campanhas, cidades e consultores. Descubra quanto cada real investido em anúncio virou contrato assinado."
      preview={
        <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Vendas por mês</p>
            <span className="rounded-lg bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-300">+20%</span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 opacity-80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dez</span>
          </div>
        </div>
      }
      features={[
        { icon: Megaphone, title: "ROI por campanha", text: "Custo por lead e por venda de cada anúncio do Instagram, Facebook e Google." },
        { icon: MapPinned, title: "Mapa de cidades", text: "Veja Teresina, Timon e região com volume de leads e taxa de conversão." },
        { icon: Users, title: "Ranking de consultores", text: "Leads assumidos, tempo de resposta e vendas fechadas por pessoa." },
        { icon: Timer, title: "Tempo de resposta", text: "Quanto tempo o lead espera entre a IA qualificar e um humano assumir." },
        { icon: CalendarRange, title: "Comparativo de períodos", text: "Mês a mês, trimestre e ano, com sazonalidade do B-R-O-Bró." },
        { icon: Download, title: "Exportar PDF e Excel", text: "Relatórios prontos para enviar à diretoria com um clique." },
      ]}
    />
  );
}
