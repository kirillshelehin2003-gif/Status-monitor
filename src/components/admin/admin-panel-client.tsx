"use client";

import { FormEvent, useMemo, useState } from "react";
import { Play, Plus, Save, ShieldAlert, ToggleLeft, ToggleRight } from "lucide-react";
import type { ServiceCategory } from "@prisma/client";
import { categoryLabels, serviceCategories, serviceStatuses, statusLabels, type DashboardSnapshotDto } from "@/types/status";
import { StatusPill } from "@/components/shared/status-pill";

type AdminSnapshot = {
  dashboard: DashboardSnapshotDto;
  logs: Array<{
    id: string;
    level: string;
    source: string;
    serviceName: string;
    serviceSlug: string | null;
    message: string;
    createdAt: string;
  }>;
};

export function AdminPanelClient({ initialSnapshot }: { initialSnapshot: AdminSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin", { cache: "no-store" });
    setSnapshot(await response.json());
  }

  async function runCheck(serviceId?: string) {
    setBusy(true);
    setNotice(null);
    try {
      await fetch("/api/admin/run-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId })
      });
      await refresh();
      setNotice("Проверка запущена и сохранена.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleService(serviceId: string, enabled: boolean) {
    setBusy(true);
    try {
      await fetch(`/api/admin/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-grid">
      <div className="side-stack">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h2 className="section-title">Управление мониторингом</h2>
              <p className="panel-copy">Добавляйте сервисы, запускайте проверки и ставьте ручные отметки инцидентов.</p>
            </div>
            <button className="primary-button" disabled={busy} onClick={() => runCheck()} type="button">
              <Play size={16} />
              Проверить все
            </button>
          </div>
          {notice ? <p className="panel-copy">{notice}</p> : null}
          <div className="service-list">
            {snapshot.dashboard.services.map((service) => (
              <div className="service-card" key={service.id}>
                <div className="service-card-top">
                  <div>
                    <h3 className="service-name">{service.name}</h3>
                    <p className="service-desc">{categoryLabels[service.category]} · {service.healthCheckUrl ?? "URL не настроен"}</p>
                  </div>
                  <StatusPill label={service.statusLabel} tone={service.statusTone} />
                </div>
                <div className="service-card-bottom">
                  <button className="ghost-link" disabled={busy} onClick={() => runCheck(service.id)} type="button">
                    <Play size={15} />
                    Проверить
                  </button>
                  <button
                    className="icon-button"
                    disabled={busy}
                    onClick={() => toggleService(service.id, !service.enabled)}
                    title={service.enabled ? "Отключить мониторинг" : "Включить мониторинг"}
                    type="button"
                  >
                    {service.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Логи</p>
              <h2 className="section-title">Последние проверки</h2>
            </div>
          </div>
          <ul className="log-list">
            {snapshot.logs.map((log) => (
              <li className="list-item" key={log.id}>
                <div className="metric-row">
                  <strong>{log.serviceName}</strong>
                  <span className="small-label">{new Date(log.createdAt).toLocaleString("ru-RU")}</span>
                </div>
                <p className="service-desc">
                  [{log.level}] {log.source}: {log.message}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="side-stack">
        <CreateServiceForm onSaved={refresh} setBusy={setBusy} />
        <ManualIncidentForm services={snapshot.dashboard.services} onSaved={refresh} setBusy={setBusy} />
      </aside>
    </section>
  );
}

function CreateServiceForm({
  onSaved,
  setBusy
}: {
  onSaved: () => Promise<void>;
  setBusy: (value: boolean) => void;
}) {
  const categories = useMemo(() => serviceCategories.map((category) => [category, categoryLabels[category]] as [ServiceCategory, string]), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      category: String(form.get("category") ?? "other"),
      description: String(form.get("description") ?? ""),
      homepageUrl: String(form.get("homepageUrl") ?? ""),
      healthCheckUrl: String(form.get("healthCheckUrl") ?? ""),
      statusPageUrl: String(form.get("statusPageUrl") ?? ""),
      regions: String(form.get("regions") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      enabled: form.get("enabled") === "on"
    };

    setBusy(true);
    try {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      event.currentTarget.reset();
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Новый сервис</p>
          <h2 className="section-title">Добавить проверку</h2>
        </div>
        <Plus size={18} color="var(--green)" />
      </div>
      <form className="form-grid" onSubmit={submit}>
        <input className="field" name="name" placeholder="Название" required />
        <input className="field" name="slug" placeholder="slug-latin" required />
        <select className="select" name="category" required>
          {categories.map(([category, label]) => (
            <option key={category} value={category}>
              {label}
            </option>
          ))}
        </select>
        <label className="switch-row">
          <span>Мониторинг включен</span>
          <input defaultChecked name="enabled" type="checkbox" />
        </label>
        <input className="field wide" name="description" placeholder="Краткое описание" required />
        <input className="field wide" name="homepageUrl" placeholder="https://service.example" />
        <input className="field wide" name="healthCheckUrl" placeholder="https://service.example/health или главная" />
        <input className="field wide" name="statusPageUrl" placeholder="JSON status page, если есть" />
        <input className="field wide" name="regions" placeholder="Россия, Европа, США" />
        <button className="primary-button wide" type="submit">
          <Save size={16} />
          Сохранить сервис
        </button>
      </form>
    </section>
  );
}

function ManualIncidentForm({
  services,
  onSaved,
  setBusy
}: {
  services: DashboardSnapshotDto["services"];
  onSaved: () => Promise<void>;
  setBusy: (value: boolean) => void;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      serviceId: String(form.get("serviceId") ?? ""),
      status: String(form.get("status") ?? "partial_outage"),
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      reason: String(form.get("reason") ?? ""),
      regions: String(form.get("regions") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      minutes: Number(form.get("minutes") ?? 120)
    };

    setBusy(true);
    try {
      await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      event.currentTarget.reset();
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Ручная отметка</p>
          <h2 className="section-title">Инцидент</h2>
        </div>
        <ShieldAlert size={18} color="var(--amber)" />
      </div>
      <form className="form-grid" onSubmit={submit}>
        <select className="select wide" name="serviceId" required>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <select className="select wide" name="status" required>
          {serviceStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <input className="field wide" name="title" placeholder="Например: проблемы с авторизацией" required />
        <input className="field wide" name="reason" placeholder="Причина" required />
        <input className="field" name="regions" placeholder="Россия, Европа" />
        <input className="field" defaultValue={120} min={15} name="minutes" type="number" />
        <textarea className="textarea wide" name="summary" placeholder="Что происходит" required />
        <button className="danger-button wide" type="submit">
          <ShieldAlert size={16} />
          Отметить инцидент
        </button>
      </form>
    </section>
  );
}
