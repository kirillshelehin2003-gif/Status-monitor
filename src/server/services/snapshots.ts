import { CheckSource, ServiceStatus, type HealthCheck, type Service } from "@prisma/client";
import { daysAgo, hoursAgo, toIso } from "@/lib/time";
import { round } from "@/lib/number";
import { prisma } from "@/server/database/prisma";
import { calculateCurrentStatusDuration, calculateOngoingDuration, calculateUptimePercent } from "@/server/services/status-engine";
import { categoryLabels, statusLabels, statusTones, type ChartPointDto, type DashboardSnapshotDto, type ServiceCardDto, type ServiceDetailDto } from "@/types/status";

type ServiceWithLatest = Service & {
  checks: HealthCheck[];
  incidents: {
    id: string;
    startedAt: Date;
    resolvedAt: Date | null;
  }[];
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshotDto> {
  const services = await prisma.service.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      checks: {
        where: { checkedAt: { gte: hoursAgo(24) } },
        orderBy: { checkedAt: "desc" },
        take: 2000
      },
      incidents: {
        where: { resolvedAt: null },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, startedAt: true, resolvedAt: true }
      }
    }
  });

  const cards = services.map(mapServiceCard);
  const checkedServices = cards.filter((card) => card.lastCheckedAt).length;
  const changedServices = cards.filter(
    (card) => card.status === ServiceStatus.partial_outage || card.status === ServiceStatus.major_outage
  ).length;
  const sinceDay = hoursAgo(24);
  const recentScores = services.flatMap((service) =>
    service.checks.filter((check) => check.checkedAt >= sinceDay).map((check) => check.problemScore)
  );
  const score =
    recentScores.length === 0
      ? 0
      : round(recentScores.reduce((sum, value) => sum + value, 0) / recentScores.length);

  return {
    generatedAt: new Date().toISOString(),
    problemIndex: {
      score,
      label: score >= 60 ? "высокая нагрузка" : score >= 25 ? "есть заметные сбои" : "спокойно",
      changedServices,
      checkedServices
    },
    services: cards.sort((a, b) => (b.problemScore ?? -1) - (a.problemScore ?? -1))
  };
}

export async function getServiceDetail(slug: string): Promise<ServiceDetailDto | null> {
  const sinceMonth = daysAgo(30);
  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      checks: {
        where: { checkedAt: { gte: sinceMonth } },
        orderBy: { checkedAt: "desc" }
      },
      incidents: {
        orderBy: { startedAt: "desc" },
        take: 12
      },
      trends: {
        orderBy: { capturedAt: "desc" },
        take: 12
      },
      reports: {
        where: { createdAt: { gte: sinceMonth } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true }
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          level: true,
          source: true,
          message: true,
          createdAt: true
        }
      }
    }
  });

  if (!service) return null;

  const card = mapServiceCard(service);
  const checks = service.checks;
  const reports = service.reports;
  const dayChecks = checks.filter((check) => check.checkedAt >= hoursAgo(24));
  const weekChecks = checks.filter((check) => check.checkedAt >= daysAgo(7));
  const monthChecks = checks;
  const dayUptime = calculateUptimePercent(dayChecks);
  const weekUptime = calculateUptimePercent(weekChecks);
  const monthUptime = calculateUptimePercent(monthChecks);

  return {
    ...card,
    homepageUrl: service.homepageUrl,
    statusPageUrl: service.statusPageUrl,
    healthCheckUrl: service.healthCheckUrl,
    charts: {
      day: buildChartSeries(checks.filter((check) => check.checkedAt >= hoursAgo(24)), reports, 24, "hour"),
      week: buildChartSeries(checks.filter((check) => check.checkedAt >= daysAgo(7)), reports, 28, "sixHours"),
      month: buildChartSeries(checks, reports, 30, "day")
    },
    uptime: {
      day: dayUptime.percent,
      week: weekUptime.percent,
      month: monthUptime.percent,
      daySamples: dayUptime.samples,
      weekSamples: weekUptime.samples,
      monthSamples: monthUptime.samples
    },
    trends: service.trends.map((trend) => ({
      query: trend.query,
      score: trend.score,
      source: trend.source,
      capturedAt: trend.capturedAt.toISOString()
    })),
    incidents: service.incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      status: incident.status,
      source: incident.source,
      startedAt: incident.startedAt.toISOString(),
      resolvedAt: toIso(incident.resolvedAt),
      affectedRegions: incident.affectedRegions,
      suspectedReasons: incident.suspectedReasons,
      summary: incident.summary
    })),
    recentLogs: service.logs.map((log) => ({
      id: log.id,
      level: log.level,
      source: log.source,
      message: log.message,
      createdAt: log.createdAt.toISOString()
    }))
  };
}

export async function getAdminSnapshot() {
  const [dashboard, logs] = await Promise.all([
    getDashboardSnapshot(),
    prisma.checkLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        service: {
          select: { name: true, slug: true }
        }
      }
    })
  ]);

  return {
    dashboard,
    logs: logs.map((log) => ({
      id: log.id,
      level: log.level,
      source: log.source,
      serviceName: log.service?.name ?? "system",
      serviceSlug: log.service?.slug ?? null,
      message: log.message,
      createdAt: log.createdAt.toISOString()
    }))
  };
}

function mapServiceCard(service: ServiceWithLatest): ServiceCardDto {
  const latest = service.checks[0];
  const durationMs = calculateOngoingDuration(
    service.checks.map((check) => ({ checkedAt: check.checkedAt, status: check.status }))
  );
  const currentStatusDurationMs = calculateCurrentStatusDuration(
    service.checks.map((check) => ({ checkedAt: check.checkedAt, status: check.status }))
  );
  const uptime24h = calculateUptimePercent(
    service.checks.filter((check) => check.checkedAt >= hoursAgo(24))
  );
  const oldestLoadedCheck = service.checks[service.checks.length - 1];

  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    category: service.category,
    description: service.description || categoryLabels[service.category],
    healthCheckUrl: service.healthCheckUrl,
    enabled: service.enabled,
    regions: service.regions,
    status: latest?.status ?? ServiceStatus.unknown,
    statusLabel: statusLabels[latest?.status ?? ServiceStatus.unknown],
    statusTone: statusTones[latest?.status ?? ServiceStatus.unknown],
    lastCheckedAt: toIso(latest?.checkedAt),
    monitoredSince: toIso(oldestLoadedCheck?.checkedAt),
    currentStatusDurationMs,
    uptime24h: uptime24h.percent,
    checkCount24h: uptime24h.samples,
    availability: latest?.availability ?? null,
    problemScore: latest?.problemScore ?? null,
    confidence: latest?.confidence ?? null,
    affectedRegions: latest?.affectedRegions ?? [],
    suspectedReasons: latest?.suspectedReasons ?? [],
    message: latest?.message ?? "Проверок еще нет. Запустите worker или ручную проверку в админке.",
    activeIncidentDurationMs: durationMs,
    source: latest?.source ?? "none"
  };
}

function buildChartSeries(
  checks: HealthCheck[],
  reports: Array<{ createdAt: Date }>,
  bucketCount: number,
  bucket: "hour" | "sixHours" | "day"
): ChartPointDto[] {
  const bucketMs = bucket === "hour" ? 60 * 60 * 1000 : bucket === "sixHours" ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const now = Date.now();

  return Array.from({ length: bucketCount }).map((_, index) => {
    const bucketStart = now - (bucketCount - index) * bucketMs;
    const bucketEnd = bucketStart + bucketMs;
    const bucketChecks = checks.filter(
      (check) => check.checkedAt.getTime() >= bucketStart && check.checkedAt.getTime() < bucketEnd
    );
    const representative = bucketChecks.sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())[0];
    const complaints = reports.filter(
      (report) => report.createdAt.getTime() >= bucketStart && report.createdAt.getTime() < bucketEnd
    ).length;

    return {
      timestamp: new Date(bucketEnd).toISOString(),
      availability: representative?.availability ?? 0,
      problemScore: representative?.problemScore ?? 0,
      complaints,
      status: representative?.status ?? ServiceStatus.unknown
    };
  });
}
