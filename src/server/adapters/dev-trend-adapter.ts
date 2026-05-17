import { CheckSource, ServiceStatus, type Prisma, type Service } from "@prisma/client";
import { insufficientSignal, type MonitorAdapter, type MonitorContext, type SourceSignal } from "./base";

type MockSignalProfile = {
  availability?: number;
  problemScore?: number;
  confidence?: number;
  status?: ServiceStatus;
  affectedRegions?: string[];
  reasons?: string[];
  trendQueries?: string[];
  trendScore?: number;
};

export function parseMockSignalProfile(value: Prisma.JsonValue | null): MockSignalProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as MockSignalProfile;
}

export class DevTrendAdapter implements MonitorAdapter {
  readonly name = "Dev search trends";
  readonly source = CheckSource.dev_mock;

  async collect(service: Service, context: MonitorContext): Promise<SourceSignal> {
    if (process.env.MONITOR_USE_DEV_SIGNALS === "false") {
      return insufficientSignal(this.source, "Dev mock сигналы отключены.");
    }

    const profile = parseMockSignalProfile(service.mockSignalProfile);
    if (!profile) {
      return insufficientSignal(this.source, "Dev profile не настроен.");
    }

    const timeBucket = Math.floor(context.now.getTime() / (1000 * 60 * 30));
    const deterministicWave = Math.sin((timeBucket + service.slug.length) / 5) * 4;
    const problemScore = Math.max(0, Math.min(100, (profile.problemScore ?? 8) + deterministicWave));
    const status = profile.status ?? statusFromScore(problemScore, profile.availability ?? 98);

    return {
      source: this.source,
      checkedAt: context.now,
      status,
      availability: profile.availability ?? (status === ServiceStatus.operational ? 99 : status === ServiceStatus.partial_outage ? 84 : 45),
      problemScore,
      confidence: profile.confidence ?? 0.54,
      quality: "partial",
      affectedRegions: profile.affectedRegions ?? [],
      suspectedReasons: profile.reasons ?? [],
      message: "Dev/mock поисковые и поведенческие сигналы. Детерминированы, без случайного изменения статусов.",
      raw: {
        trendQueries: profile.trendQueries ?? [],
        trendScore: profile.trendScore ?? Math.round(problemScore)
      }
    };
  }
}

function statusFromScore(score: number, availability: number): ServiceStatus {
  if (score >= 70 || availability <= 55) return ServiceStatus.major_outage;
  if (score >= 30 || availability <= 90) return ServiceStatus.partial_outage;
  return ServiceStatus.operational;
}
