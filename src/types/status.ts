import type { CheckSource, ServiceCategory, ServiceStatus } from "@prisma/client";

export type StatusSummary = {
  status: ServiceStatus;
  label: string;
  tone: "green" | "amber" | "red" | "muted";
};

export type ServiceCardDto = {
  id: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  healthCheckUrl?: string | null;
  enabled: boolean;
  regions: string[];
  status: ServiceStatus;
  statusLabel: string;
  statusTone: StatusSummary["tone"];
  lastCheckedAt: string | null;
  monitoredSince: string | null;
  currentStatusDurationMs: number | null;
  uptime24h: number | null;
  checkCount24h: number;
  availability: number | null;
  problemScore: number | null;
  confidence: number | null;
  affectedRegions: string[];
  suspectedReasons: string[];
  message: string;
  activeIncidentDurationMs: number | null;
  source: CheckSource | "mixed" | "none";
};

export type ProblemIndexDto = {
  score: number;
  label: string;
  changedServices: number;
  checkedServices: number;
};

export type DashboardSnapshotDto = {
  generatedAt: string;
  problemIndex: ProblemIndexDto;
  services: ServiceCardDto[];
};

export type ChartPointDto = {
  timestamp: string;
  availability: number;
  problemScore: number;
  complaints: number;
  status: ServiceStatus;
};

export type TrendDto = {
  query: string;
  score: number;
  source: string;
  capturedAt: string;
};

export type IncidentDto = {
  id: string;
  title: string;
  status: ServiceStatus;
  source: string;
  startedAt: string;
  resolvedAt: string | null;
  affectedRegions: string[];
  suspectedReasons: string[];
  summary: string;
};

export type ServiceDetailDto = ServiceCardDto & {
  homepageUrl: string | null;
  statusPageUrl: string | null;
  healthCheckUrl: string | null;
  charts: {
    day: ChartPointDto[];
    week: ChartPointDto[];
    month: ChartPointDto[];
  };
  uptime: {
    day: number | null;
    week: number | null;
    month: number | null;
    daySamples: number;
    weekSamples: number;
    monthSamples: number;
  };
  trends: TrendDto[];
  incidents: IncidentDto[];
  recentLogs: {
    id: string;
    level: string;
    source: string;
    message: string;
    createdAt: string;
  }[];
};

export const categoryLabels: Record<ServiceCategory, string> = {
  games: "Игры",
  social: "Соцсети",
  messenger: "Мессенджеры",
  video: "Видео",
  finance: "Финансы",
  cloud: "Облака",
  search: "Поиск",
  marketplace: "Маркетплейсы",
  other: "Другое"
};

export const serviceCategories = Object.keys(categoryLabels) as ServiceCategory[];

export const statusLabels: Record<ServiceStatus, string> = {
  operational: "работает",
  partial_outage: "частичные проблемы",
  major_outage: "массовый сбой",
  unknown: "неизвестно"
};

export const serviceStatuses = Object.keys(statusLabels) as ServiceStatus[];

export const statusTones: Record<ServiceStatus, StatusSummary["tone"]> = {
  operational: "green",
  partial_outage: "amber",
  major_outage: "red",
  unknown: "muted"
};
