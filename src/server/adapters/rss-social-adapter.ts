import { CheckSource, ServiceStatus, type Service } from "@prisma/client";
import { insufficientSignal, type MonitorAdapter, type MonitorContext, type SourceSignal } from "./base";
import { parseMockSignalProfile } from "./dev-trend-adapter";

export class RssSocialSignalAdapter implements MonitorAdapter {
  readonly name = "RSS and social signals";
  readonly source = CheckSource.rss_social;

  async collect(service: Service, context: MonitorContext): Promise<SourceSignal> {
    const profile = parseMockSignalProfile(service.mockSignalProfile);
    if (!profile || process.env.MONITOR_USE_DEV_SIGNALS === "false") {
      return insufficientSignal(this.source, "RSS/social источник не настроен.");
    }

    const trendScore = profile.trendScore ?? profile.problemScore ?? 8;
    const problemScore = Math.max(0, Math.min(100, trendScore * 0.78));
    const status =
      problemScore >= 58
        ? ServiceStatus.major_outage
        : problemScore >= 26
          ? ServiceStatus.partial_outage
          : ServiceStatus.operational;

    return {
      source: this.source,
      checkedAt: context.now,
      status,
      availability: status === ServiceStatus.operational ? 99 : status === ServiceStatus.partial_outage ? 87 : 60,
      problemScore,
      confidence: 0.46,
      quality: "partial",
      affectedRegions: profile.affectedRegions ?? [],
      suspectedReasons: profile.reasons ?? [],
      message: "RSS/social слой готов к подключению настоящих источников. В dev использует профиль сервиса.",
      raw: {
        trendQueries: profile.trendQueries ?? [],
        trendScore
      }
    };
  }
}
