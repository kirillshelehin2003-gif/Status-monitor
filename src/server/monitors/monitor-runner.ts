import { CheckSource, IncidentSource, Prisma, ServiceStatus, type Service } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { parseMockSignalProfile } from "@/server/adapters/dev-trend-adapter";
import { createSourceRegistry } from "@/server/monitors/source-registry";
import { aggregateSignals, detectAnomaly } from "@/server/services/status-engine";
import { getDashboardSnapshot } from "@/server/services/snapshots";
import { publishDashboardSnapshot } from "@/server/realtime/status-events";

const adapters = createSourceRegistry(prisma);

export async function runMonitoringCycle(): Promise<{ checked: number; failed: number }> {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" }
  });

  let failed = 0;
  for (const service of services) {
    try {
      await runServiceCheck(service);
    } catch (error) {
      failed += 1;
      await prisma.checkLog.create({
        data: {
          serviceId: service.id,
          level: "error",
          source: "monitor",
          message: `Проверка ${service.name} завершилась ошибкой.`,
          meta: { error: error instanceof Error ? error.message : String(error) }
        }
      });
    }
  }

  const snapshot = await getDashboardSnapshot();
  await publishDashboardSnapshot(snapshot);
  return { checked: services.length, failed };
}

export async function runServiceCheck(service: Service) {
  const context = { now: new Date() };
  const signals = await Promise.all(adapters.map((adapter) => adapter.collect(service, context)));
  const aggregate = aggregateSignals(signals);

  const previousChecks = await prisma.healthCheck.findMany({
    where: { serviceId: service.id },
    orderBy: { checkedAt: "desc" },
    take: 24,
    select: { problemScore: true }
  });
  const anomaly = detectAnomaly(
    aggregate.problemScore,
    previousChecks.slice(1).map((check) => check.problemScore)
  );

  const check = await prisma.healthCheck.create({
    data: {
      serviceId: service.id,
      source: pickPersistedSource(aggregate.source, signals),
      checkedAt: context.now,
      status: aggregate.status,
      latencyMs: pickLatency(signals),
      availability: aggregate.availability,
      problemScore: aggregate.problemScore,
      confidence: aggregate.confidence,
      affectedRegions: aggregate.affectedRegions,
      suspectedReasons: aggregate.suspectedReasons,
      message: anomaly ? `${aggregate.message} Обнаружена аномалия относительно базовой линии.` : aggregate.message,
      raw: toJson(aggregate.raw)
    }
  });

  await Promise.all([
    syncIncident(service, check.status, check.checkedAt, check.affectedRegions, check.suspectedReasons, check.message),
    syncSearchTrends(service),
    prisma.checkLog.create({
      data: {
        serviceId: service.id,
        level: check.status === ServiceStatus.major_outage ? "warn" : "info",
        source: "monitor",
        message: `${service.name}: ${check.status}, score ${Math.round(check.problemScore)}%, availability ${Math.round(check.availability)}%.`,
        meta: {
          status: check.status,
          problemScore: check.problemScore,
          availability: check.availability,
          anomaly
        }
      }
    })
  ]);

  return check;
}

async function syncIncident(
  service: Service,
  status: ServiceStatus,
  checkedAt: Date,
  affectedRegions: string[],
  suspectedReasons: string[],
  summary: string
) {
  const openIncident = await prisma.incident.findFirst({
    where: { serviceId: service.id, resolvedAt: null },
    orderBy: { startedAt: "desc" }
  });

  if (status === ServiceStatus.operational || status === ServiceStatus.unknown) {
    if (openIncident) {
      await prisma.incident.update({
        where: { id: openIncident.id },
        data: { resolvedAt: checkedAt, summary: `${openIncident.summary} Решено: ${summary}` }
      });
    }
    return;
  }

  if (openIncident) {
    await prisma.incident.update({
      where: { id: openIncident.id },
      data: {
        status,
        affectedRegions,
        suspectedReasons,
        summary
      }
    });
    return;
  }

  await prisma.incident.create({
    data: {
      serviceId: service.id,
      title: status === ServiceStatus.major_outage ? `Массовый сбой ${service.name}` : `Деградация ${service.name}`,
      status,
      source: IncidentSource.automatic,
      startedAt: checkedAt,
      affectedRegions,
      suspectedReasons,
      summary
    }
  });
}

async function syncSearchTrends(service: Service) {
  if (process.env.MONITOR_USE_DEV_SIGNALS === "false") {
    return;
  }

  const profile = parseMockSignalProfile(service.mockSignalProfile);
  const queries = profile?.trendQueries ?? [
    `${service.name} не работает`,
    `${service.name} сбой сегодня`,
    `почему не работает ${service.name}`
  ];
  const score = Math.round(profile?.trendScore ?? profile?.problemScore ?? 8);
  const capturedAt = new Date();
  const hourAgo = new Date(capturedAt.getTime() - 60 * 60 * 1000);

  const existing = await prisma.searchTrend.count({
    where: { serviceId: service.id, capturedAt: { gte: hourAgo } }
  });
  if (existing > 0) return;

  await prisma.searchTrend.createMany({
    data: queries.slice(0, 5).map((query, index) => ({
      serviceId: service.id,
      query,
      score: Math.max(1, score - index * 7),
      source: profile ? "dev-mock-trends" : "generated-template",
      capturedAt
    }))
  });
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function pickPersistedSource(
  aggregateSource: ReturnType<typeof aggregateSignals>["source"],
  signals: Awaited<ReturnType<(typeof adapters)[number]["collect"]>>[]
): CheckSource {
  if (aggregateSource !== "mixed" && aggregateSource !== "none") {
    return aggregateSource;
  }

  const usefulSources = signals
    .filter((signal) => signal.quality !== "insufficient")
    .map((signal) => signal.source);

  return (
    [
      CheckSource.manual_admin,
      CheckSource.official_status,
      CheckSource.http_health,
      CheckSource.api_endpoint,
      CheckSource.user_reports,
      CheckSource.rss_social,
      CheckSource.dev_mock
    ].find((source) => usefulSources.includes(source)) ?? CheckSource.http_health
  );
}

function pickLatency(signals: Awaited<ReturnType<(typeof adapters)[number]["collect"]>>[]): number | null {
  const latencies = signals.map((signal) => signal.latencyMs).filter((value): value is number => typeof value === "number");
  if (!latencies.length) return null;
  return Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length);
}
