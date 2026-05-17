import { Search } from "lucide-react";
import type { TrendDto } from "@/types/status";

export function TrendList({ trends, serviceName }: { trends: TrendDto[]; serviceName: string }) {
  const fallback = [
    `${serviceName} не работает`,
    `${serviceName} сбой сегодня`,
    `почему не работает ${serviceName}`
  ];
  const items = trends.length > 0 ? trends.map((trend) => trend.query) : fallback;

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Поиск</p>
          <h2 className="section-title">Что сейчас ищут</h2>
        </div>
        <Search size={18} color="var(--blue)" />
      </div>
      <ul className="trend-list">
        {items.map((query, index) => (
          <li className="list-item metric-row" key={query}>
            <span>{query}</span>
            <strong>{trends[index]?.score ?? "н/д"}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
