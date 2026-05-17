import { CheckSource, ServiceStatus, type PrismaClient, type Service } from "@prisma/client";
import { type MonitorAdapter, type MonitorContext, type SourceSignal } from "./base";

export class UserReportAdapter implements MonitorAdapter {
  readonly name = "User reports";
  readonly source = CheckSource.user_reports;

  constructor(private readonly db: PrismaClient) {}

  async collect(service: Service, context: MonitorContext): Promise<SourceSignal> {
    const oneHourAgo = new Date(context.now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(context.now.getTime() - 24 * 60 * 60 * 1000);
    const [recentReports, dayReports] = await Promise.all([
      this.db.userReport.findMany({
        where: { serviceId: service.id, createdAt: { gte: oneHourAgo } },
        select: { region: true, reason: true }
      }),
      this.db.userReport.count({
        where: { serviceId: service.id, createdAt: { gte: dayAgo } }
      })
    ]);

    const baselinePerHour = Math.max(1, dayReports / 24);
    const ratio = recentReports.length / baselinePerHour;
    const problemScore = Math.min(100, Math.round(ratio * 18));
    const status =
      recentReports.length < 3
        ? ServiceStatus.operational
        : problemScore >= 70
          ? ServiceStatus.major_outage
          : problemScore >= 30
            ? ServiceStatus.partial_outage
            : ServiceStatus.operational;

    return {
      source: this.source,
      checkedAt: context.now,
      status,
      availability: status === ServiceStatus.operational ? 99 : status === ServiceStatus.partial_outage ? 84 : 55,
      problemScore,
      confidence: recentReports.length >= 5 ? 0.7 : 0.34,
      quality: recentReports.length >= 3 ? "complete" : "partial",
      affectedRegions: Array.from(new Set(recentReports.map((report) => report.region).filter(Boolean))) as string[],
      suspectedReasons: Array.from(new Set(recentReports.map((report) => report.reason))).slice(0, 4),
      message:
        recentReports.length > 0
          ? `${recentReports.length} жалоб за последний час, базовая частота ${baselinePerHour.toFixed(1)}/ч.`
          : "Новых пользовательских жалоб почти нет.",
      raw: {
        recentReports: recentReports.length,
        baselinePerHour
      }
    };
  }
}
