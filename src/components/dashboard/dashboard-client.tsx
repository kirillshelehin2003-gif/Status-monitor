"use client";

import { useMemo, useState } from "react";
import type { ServiceCategory } from "@prisma/client";
import { Search, Wifi, WifiOff } from "lucide-react";
import { useStatusStream } from "@/hooks/use-status-stream";
import type { DashboardSnapshotDto } from "@/types/status";
import { CategoryFilter } from "@/components/dashboard/category-filter";
import { ProblemIndex } from "@/components/dashboard/problem-index";
import { ServiceCard } from "@/components/dashboard/service-card";
import { EmptyState } from "@/components/shared/empty-state";

type CategoryValue = ServiceCategory | "all";

export function DashboardClient({ initialSnapshot }: { initialSnapshot: DashboardSnapshotDto }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryValue>("all");
  const { connected, error } = useStatusStream(setSnapshot);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.services.filter((service) => {
      const matchesCategory = category === "all" || service.category === category;
      const matchesQuery =
        normalized.length === 0 ||
        service.name.toLowerCase().includes(normalized) ||
        service.slug.toLowerCase().includes(normalized) ||
        service.description.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, snapshot.services]);

  const brokenNow = snapshot.services.filter(
    (service) => service.status === "major_outage" || service.status === "partial_outage"
  );

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Live dashboard</p>
            <h2 className="panel-title">Сервисы под наблюдением</h2>
            <p className="panel-copy">
              Сначала показываем то, что сейчас вызывает больше всего жалоб и технических аномалий.
            </p>
          </div>
          <span className="status-pill" data-tone={connected ? "green" : "amber"} title={error ?? "SSE активно"}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? "live" : "polling"}
          </span>
        </div>

        <div className="toolbar">
          <label>
            <span className="small-label">Поиск сервиса</span>
            <div style={{ position: "relative", marginTop: 6 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 13, color: "var(--text-muted)" }} />
              <input
                className="search-field"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Steam, Telegram, YouTube..."
                style={{ paddingLeft: 36 }}
                value={query}
              />
            </div>
          </label>
          <CategoryFilter value={category} onChange={setCategory} />
        </div>

        {brokenNow.length > 0 ? (
          <div className="panel" style={{ marginBottom: 14, background: "rgba(142, 31, 54, 0.16)" }}>
            <p className="eyebrow">Сейчас заметны проблемы</p>
            <div className="category-tabs">
              {brokenNow.slice(0, 6).map((service) => (
                <a className="tab" href={`/services/${service.slug}`} key={service.id}>
                  {service.name} · {service.problemScore ?? 0}%
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="service-list">
            {filtered.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <EmptyState title="Ничего не найдено" text="Попробуйте другой запрос или сбросьте фильтр категории." />
        )}
      </div>

      <ProblemIndex index={snapshot.problemIndex} />
    </section>
  );
}
