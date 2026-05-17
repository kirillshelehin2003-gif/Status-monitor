import { AlertTriangle, Gauge, RadioTower } from "lucide-react";
import type { CSSProperties } from "react";
import type { ProblemIndexDto } from "@/types/status";

export function ProblemIndex({ index }: { index: ProblemIndexDto }) {
  return (
    <aside className="side-stack">
      <section className="metric-card">
        <div className="inline-row">
          <p className="eyebrow">Индекс 24 часа</p>
          <Gauge size={18} color="var(--blue)" />
        </div>
        <p className="metric-value">{index.score}%</p>
        <p className="metric-label">{index.label}</p>
        <div className="meter" aria-label="Общий индекс проблем">
          <span className="meter-fill" style={{ "--value": `${index.score}%` } as CSSProperties} />
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Сводка</p>
            <h2 className="section-title">Что сейчас сломано</h2>
          </div>
          <AlertTriangle size={18} color="var(--amber)" />
        </div>
        <ul className="breakdown-list">
          <li className="list-item metric-row">
            <span className="small-label">Сервисов с проблемами</span>
            <strong>{index.changedServices}</strong>
          </li>
          <li className="list-item metric-row">
            <span className="small-label">Проверено сервисов</span>
            <strong>{index.checkedServices}</strong>
          </li>
          <li className="list-item metric-row">
            <span className="small-label">Real-time канал</span>
            <RadioTower size={17} color="var(--green)" />
          </li>
        </ul>
      </section>
    </aside>
  );
}
