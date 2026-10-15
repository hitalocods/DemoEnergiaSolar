"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

/** Mini gráfico de linha (sem eixos) para os cards de métrica. */
export function Sparkline({ data, color, id }: { data: number[]; color: string; id: string }) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={points} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
