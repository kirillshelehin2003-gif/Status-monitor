"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPointDto } from "@/types/status";

export function AvailabilityChart({ data }: { data: ChartPointDto[] }) {
  return (
    <div className="chart-card">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ left: -18, right: 6, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="availability" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#45d18b" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#45d18b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Area
            dataKey="availability"
            fill="url(#availability)"
            name="Доступность"
            stroke="#45d18b"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
