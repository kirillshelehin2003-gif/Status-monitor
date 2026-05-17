import { CheckSource, type PrismaClient, type Service } from "@prisma/client";
import { insufficientSignal, type MonitorAdapter, type MonitorContext, type SourceSignal } from "./base";
import { availabilityForStatus, scoreForStatus } from "@/server/services/status-engine";

export class ManualOverrideAdapter implements MonitorAdapter {
  readonly name = "Manual admin override";
  readonly source = CheckSource.manual_admin;

  constructor(private readonly db: PrismaClient) {}

  async collect(service: Service, context: MonitorContext): Promise<SourceSignal> {
    const override = await this.db.manualOverride.findFirst({
      where: {
        serviceId: service.id,
        startsAt: { lte: context.now },
        OR: [{ endsAt: null }, { endsAt: { gt: context.now } }]
      },
      orderBy: { startsAt: "desc" }
    });

    if (!override) {
      return insufficientSignal(this.source, "Активной ручной отметки нет.");
    }

    return {
      source: this.source,
      checkedAt: context.now,
      status: override.status,
      availability: availabilityForStatus(override.status),
      problemScore: scoreForStatus(override.status),
      confidence: 0.98,
      quality: "complete",
      affectedRegions: override.regions,
      suspectedReasons: [override.reason],
      message: `Ручная отметка администратора: ${override.reason}`,
      raw: {
        overrideId: override.id,
        createdBy: override.createdBy,
        startsAt: override.startsAt,
        endsAt: override.endsAt
      }
    };
  }
}
