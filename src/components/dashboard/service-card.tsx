import Link from "next/link";
import { Activity, Clock, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import { percent } from "@/lib/number";
import { formatElapsedRu } from "@/lib/time";
import { categoryLabels, type ServiceCardDto } from "@/types/status";
import { StatusPill } from "@/components/shared/status-pill";

export function ServiceCard({ service }: { service: ServiceCardDto }) {
  return (
    <Link className="service-card" href={`/services/${service.slug}`}>
      <div className="service-card-top">
        <div>
          <h2 className="service-name">{service.name}</h2>
          <p className="service-desc">{categoryLabels[service.category]} · {service.description}</p>
        </div>
        <StatusPill label={service.statusLabel} tone={service.statusTone} />
      </div>

      <p className="service-desc">{service.message}</p>

      <div>
        <div className="metric-row">
          <span className="small-label">Уровень проблем</span>
          <strong>{percent(service.problemScore)}</strong>
        </div>
        <div className="meter">
          <span className="meter-fill" style={{ "--value": `${service.problemScore ?? 0}%` } as CSSProperties} />
        </div>
      </div>

      <div className="service-card-bottom">
        <span className="small-label inline-row">
          <Activity size={14} />
          uptime 24ч {percent(service.uptime24h)}
        </span>
        <span className="small-label inline-row">
          <Clock size={14} />
          статус {formatElapsedRu(service.currentStatusDurationMs)}
        </span>
        {service.affectedRegions.length > 0 ? (
          <span className="small-label inline-row" title={service.affectedRegions.join(", ")}>
            <MapPin size={14} />
            {service.affectedRegions[0]}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
