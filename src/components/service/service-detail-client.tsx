"use client";

import { useMemo, useState } from "react";
import { Activity, Clock, ExternalLink, Server, ShieldAlert } from "lucide-react";
import { percent } from "@/lib/number";
import { formatElapsedRu } from "@/lib/time";
import { useStatusStream } from "@/hooks/use-status-stream";
import type { ChartPointDto, ServiceDetailDto } from "@/types/status";
import { categoryLabels } from "@/types/status";
import { AvailabilityChart } from "@/components/charts/availability-chart";
import { ProblemChart } from "@/components/charts/problem-chart";
import { StatusPill } from "@/components/shared/status-pill";
import { TrendList } from "@/components/service/trend-list";

type Range = "day" | "week" | "month";

export function ServiceDetailClient({ initialDetail }: { initialDetail: ServiceDetailDto }) {
  const [detail, setDetail] = useState(initialDetail);
  const [range, setRange] = useState<Range>("day");

  useStatusStream((snapshot) => {
    const updated = snapshot.services.find((service) => service.slug === detail.slug);
    if (!updated) return;
    setDetail((current) => ({
      ...current,
      ...updated
    }));
  });

  const chartData: ChartPointDto[] = useMemo(() => detail.charts[range], [detail.charts, range]);

  return (
    <section className="detail-grid">
      <div className="side-stack">
        <section className="panel detail-hero">
          <div>
            <p className="eyebrow">{categoryLabels[detail.category]}</p>
            <h2 className="hero-name">{detail.name}</h2>
            <p className="panel-copy">{detail.message}</p>
            <div className="metric-strip">
              <div className="mini-metric">
                <span className="small-label">Статус</span>
                <strong>
                  <StatusPill label={detail.statusLabel} tone={detail.statusTone} />
                </strong>
              </div>
              <div className="mini-metric">
                <span className="small-label">Проблемы</span>
                <strong>{percent(detail.problemScore)}</strong>
              </div>
              <div className="mini-metric">
                <span className="small-label">Uptime 24ч</span>
                <strong>{percent(detail.uptime24h)}</strong>
              </div>
              <div className="mini-metric">
                <span className="small-label">Текущий статус</span>
                <strong>{formatElapsedRu(detail.currentStatusDurationMs)}</strong>
              </div>
            </div>
          </div>
          <div className="metric-card">
            <div className="inline-row">
              <p className="eyebrow">Последняя проверка</p>
              <Activity size={18} color="var(--green)" />
            </div>
            <p className="metric-label">
              {detail.lastCheckedAt ? new Date(detail.lastCheckedAt).toLocaleString("ru-RU") : "проверок нет"}
            </p>
            <p className="service-desc">
              Наблюдаем с{" "}
              {detail.monitoredSince ? new Date(detail.monitoredSince).toLocaleString("ru-RU") : "момента первой проверки"}.
            </p>
            {detail.homepageUrl ? (
              <a className="ghost-link" href={detail.homepageUrl} rel="noreferrer" target="_blank">
                <ExternalLink size={15} />
                Открыть сервис
              </a>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Доступность</p>
              <h2 className="section-title">Real-time график</h2>
            </div>
            <div className="range-tabs">
              {rangeButtons.map((button) => (
                <button
                  className="tab"
                  data-active={range === button.value}
                  key={button.value}
                  onClick={() => setRange(button.value)}
                  type="button"
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
          <AvailabilityChart data={chartData} />
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Жалобы и аномалии</p>
              <h2 className="section-title">Нагрузка за период</h2>
            </div>
            <ShieldAlert size={18} color="var(--amber)" />
          </div>
          <ProblemChart data={chartData} />
        </section>
      </div>

      <aside className="side-stack">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Uptime</p>
              <h2 className="section-title">Фактическая доступность</h2>
            </div>
            <Activity size={18} color="var(--green)" />
          </div>
          <ul className="breakdown-list">
            <li className="list-item metric-row">
              <span className="small-label">За 24 часа · {detail.uptime.daySamples} проверок</span>
              <strong>{percent(detail.uptime.day)}</strong>
            </li>
            <li className="list-item metric-row">
              <span className="small-label">За 7 дней · {detail.uptime.weekSamples} проверок</span>
              <strong>{percent(detail.uptime.week)}</strong>
            </li>
            <li className="list-item metric-row">
              <span className="small-label">За 30 дней · {detail.uptime.monthSamples} проверок</span>
              <strong>{percent(detail.uptime.month)}</strong>
            </li>
          </ul>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Причины</p>
              <h2 className="section-title">Возможные проблемы</h2>
            </div>
            <Server size={18} color="var(--violet)" />
          </div>
          <ul className="breakdown-list">
            {(detail.suspectedReasons.length > 0 ? detail.suspectedReasons : ["недостаточно данных"]).map((reason) => (
              <li className="list-item" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Регионы</p>
              <h2 className="section-title">Затронутые зоны</h2>
            </div>
            <Clock size={18} color="var(--blue)" />
          </div>
          <ul className="breakdown-list">
            {(detail.affectedRegions.length > 0 ? detail.affectedRegions : ["региональные данные не подтверждены"]).map((region) => (
              <li className="list-item" key={region}>
                {region}
              </li>
            ))}
          </ul>
        </section>

        <TrendList trends={detail.trends} serviceName={detail.name} />

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">История</p>
              <h2 className="section-title">Последние инциденты</h2>
            </div>
          </div>
          <ul className="incident-list">
            {detail.incidents.length > 0 ? (
              detail.incidents.map((incident) => (
                <li className="list-item" key={incident.id}>
                  <div className="metric-row">
                    <strong>{incident.title}</strong>
                    <span className="small-label">{new Date(incident.startedAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <p className="service-desc">{incident.summary}</p>
                </li>
              ))
            ) : (
              <li className="list-item">Инцидентов пока нет.</li>
            )}
          </ul>
        </section>
      </aside>
    </section>
  );
}

const rangeButtons: Array<{ value: Range; label: string }> = [
  { value: "day", label: "24ч" },
  { value: "week", label: "7д" },
  { value: "month", label: "30д" }
];
