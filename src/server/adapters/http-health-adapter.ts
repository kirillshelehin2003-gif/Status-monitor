import { CheckSource, ServiceStatus, type Service } from "@prisma/client";
import { insufficientSignal, type MonitorAdapter, type MonitorContext, type SourceSignal } from "./base";

export class HttpHealthAdapter implements MonitorAdapter {
  readonly name = "HTTP health";
  readonly source = CheckSource.http_health;

  async collect(service: Service, context: MonitorContext): Promise<SourceSignal> {
    if (!service.healthCheckUrl) {
      return insufficientSignal(this.source, "URL проверки не настроен.");
    }

    const timeoutMs = Number(process.env.HTTP_CHECK_TIMEOUT_MS ?? 6000);
    const started = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(service.healthCheckUrl, {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "StatusMonitorMVP/0.1 (+local-dev)"
        }
      });
      const latencyMs = Math.round(performance.now() - started);
      const ok = response.status >= 200 && response.status < 400;
      const slow = latencyMs > timeoutMs * 0.75;

      return {
        source: this.source,
        checkedAt: context.now,
        status: ok && !slow ? ServiceStatus.operational : ok ? ServiceStatus.partial_outage : ServiceStatus.major_outage,
        availability: ok ? (slow ? 88 : 99) : response.status >= 500 ? 45 : 70,
        latencyMs,
        problemScore: ok ? (slow ? 34 : Math.min(12, latencyMs / 120)) : response.status >= 500 ? 78 : 46,
        confidence: ok ? 0.75 : 0.68,
        quality: "complete",
        affectedRegions: [],
        suspectedReasons: ok ? (slow ? ["проблемы с серверами"] : []) : ["не открывается сайт", "проблемы DNS/CDN/API"],
        message: ok ? `HTTP ${response.status}, ${latencyMs} мс.` : `HTTP ${response.status}, сервис отвечает с ошибкой.`,
        raw: {
          url: service.healthCheckUrl,
          status: response.status,
          statusText: response.statusText,
          latencyMs
        }
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - started);
      return {
        source: this.source,
        checkedAt: context.now,
        status: ServiceStatus.unknown,
        availability: 0,
        latencyMs,
        problemScore: 52,
        confidence: 0.42,
        quality: "partial",
        affectedRegions: [],
        suspectedReasons: ["не открывается сайт", "проблемы DNS/CDN/API"],
        message: "HTTP проверка не смогла получить ответ. Это может быть сетевое ограничение среды, а не реальный сбой сервиса.",
        raw: {
          url: service.healthCheckUrl,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
