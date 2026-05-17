import { CheckSource, ServiceStatus, type Service } from "@prisma/client";
import { insufficientSignal, type MonitorAdapter, type MonitorContext, type SourceSignal } from "./base";

type StatusPagePayload = {
  status?: {
    indicator?: "none" | "minor" | "major" | "critical";
    description?: string;
  };
};

export class OfficialStatusAdapter implements MonitorAdapter {
  readonly name = "Official status page";
  readonly source = CheckSource.official_status;

  async collect(service: Service, context: MonitorContext): Promise<SourceSignal> {
    if (!service.statusPageUrl) {
      return insufficientSignal(this.source, "Официальная status page не настроена.");
    }

    if (!service.statusPageUrl.endsWith(".json")) {
      return insufficientSignal(
        this.source,
        "Status page указана, но для MVP нужен JSON endpoint. HTML scraping вынесен в отдельный адаптер.",
        { statusPageUrl: service.statusPageUrl }
      );
    }

    try {
      const response = await fetch(service.statusPageUrl, { cache: "no-store" });
      if (!response.ok) {
        return insufficientSignal(this.source, `Status page вернула HTTP ${response.status}.`);
      }
      const payload = (await response.json()) as StatusPagePayload;
      const indicator = payload.status?.indicator ?? "none";
      const status =
        indicator === "critical" || indicator === "major"
          ? ServiceStatus.major_outage
          : indicator === "minor"
            ? ServiceStatus.partial_outage
            : ServiceStatus.operational;

      return {
        source: this.source,
        checkedAt: context.now,
        status,
        availability: status === ServiceStatus.operational ? 99 : status === ServiceStatus.partial_outage ? 82 : 42,
        problemScore: status === ServiceStatus.operational ? 4 : status === ServiceStatus.partial_outage ? 42 : 82,
        confidence: 0.92,
        quality: "complete",
        affectedRegions: [],
        suspectedReasons: status === ServiceStatus.operational ? [] : ["проблемы с серверами"],
        message: payload.status?.description ?? "Официальная status page обработана.",
        raw: payload
      };
    } catch (error) {
      return insufficientSignal(this.source, "Не удалось прочитать официальную status page.", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
