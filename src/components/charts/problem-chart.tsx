"use client";

import { Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPointDto } from "@/types/status";

export function ProblemChart({ data }: { data: ChartPointDto[] }) {
  return (
    <div className="chart-card">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ left: -18, right: 6, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            minTickGap={28}
            tick={{ fill: "#8f8390", fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
          />
          <YAxis domain={[0, 100]} tick={{ fill: "#8f8390", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "#24202b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
            labelFormatter={(value) => new Date(String(value)).toLocaleString("ru-RU")}
          />
          <Bar dataKey="problemScore" fill="#b3394f" name="Уровень проблем" radius={[6, 6, 0, 0]} />
          <Line dataKey="complaints" dot={false} name="Жалобы" stroke="#f1a94b" strokeWidth={2} type="monotone" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
