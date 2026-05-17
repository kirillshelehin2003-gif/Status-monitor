import { CheckSource, ServiceStatus } from "@prisma/client";
import { clamp, round } from "@/lib/number";
import type { SourceSignal } from "@/server/adapters/base";

export type AggregatedStatus = {
  status: ServiceStatus;
  availability: number;
  problemScore: number;
  confidence: number;
  affectedRegions: string[];
  suspectedReasons: string[];
  message: string;
  source: CheckSource | "mixed" | "none";
  quality: "complete" | "partial" | "insufficient";
  raw: {
    signals: SourceSignal[];
    scoreBreakdown: {
      source: CheckSource;
      problemScore: number | null;
      confidence: number;
      quality: SourceSignal["quality"];
    }[];
  };
};

const statusPriority: Record<ServiceStatus, number> = {
  unknown: 0,
  operational: 1,
  partial_outage: 2,
  major_outage: 3
};

export const knownProblemReasons = [
  "проблемы с авторизацией",
  "не открывается сайт",
  "не работает приложение",
  "не загружаются изображения/видео",
  "ошибки оплаты",
  "проблемы с серверами",
  "региональная блокировка",
  "проблемы DNS/CDN/API"
];

export function aggregateSignals(signals: SourceSignal[]): AggregatedStatus {
  const usefulSignals = signals.filter((signal) => signal.quality !== "insufficient");
  const manualSignal = usefulSignals.find((signal) => signal.source === CheckSource.manual_admin);

  if (manualSignal?.status) {
    const score = scoreForStatus(manualSignal.status, manualSignal.problemScore);
    return buildAggregate([manualSignal], manualSignal.status, score, manualSignal.availability ?? availabilityForStatus(manualSignal.status), "complete");
  }

  if (usefulSignals.length === 0) {
    return {
      status: ServiceStatus.unknown,
      availability: 0,
      problemScore: 0,
      confidence: 0,
      affectedRegions: [],
      suspectedReasons: [],
      message: "Недостаточно данных для честной оценки статуса.",
      source: "none",
      quality: "insufficient",
      raw: {
        signals,
        scoreBreakdown: signals.map((signal) => ({
          source: signal.source,
          problemScore: signal.problemScore ?? null,
          confidence: signal.confidence,
          quality: signal.quality
        }))
      }
    };
  }

  const weightedScore = weightedAverage(
    usefulSignals.map((signal) => ({
      value: scoreForStatus(signal.status, signal.problemScore),
      weight: signal.confidence
    }))
  );
  const weightedAvailability = weightedAverage(
    usefulSignals.map((signal) => ({
      value: signal.availability ?? availabilityForStatus(signal.status ?? ServiceStatus.unknown),
      weight: signal.confidence
    }))
  );
  const confidence = clamp(
    usefulSignals.reduce((sum, signal) => sum + signal.confidence, 0) / Math.max(2.2, usefulSignals.length),
    0,
    1
  );

  if (confidence < 0.28) {
    return buildAggregate(usefulSignals, ServiceStatus.unknown, round(weightedScore), round(weightedAvailability), "partial");
  }

  const highestExplicit = usefulSignals
    .map((signal) => signal.status)
    .filter(Boolean)
    .sort((a, b) => statusPriority[b!] - statusPriority[a!])[0];

  const status = chooseStatus(weightedScore, weightedAvailability, highestExplicit);
  const quality = confidence > 0.7 ? "complete" : "partial";
  return buildAggregate(usefulSignals, status, round(weightedScore), round(weightedAvailability), quality);
}

export function chooseStatus(
  problemScore: number,
  availability: number,
  highestExplicit?: ServiceStatus
): ServiceStatus {
  if (highestExplicit === ServiceStatus.major_outage) return ServiceStatus.major_outage;
  if (problemScore >= 70 || availability <= 55) return ServiceStatus.major_outage;
  if (highestExplicit === ServiceStatus.partial_outage) return ServiceStatus.partial_outage;
  if (problemScore >= 30 || availability <= 90) return ServiceStatus.partial_outage;
  if (problemScore <= 12 && availability >= 96) return ServiceStatus.operational;
  return ServiceStatus.unknown;
}

export function scoreForStatus(status: ServiceStatus | undefined, explicitScore?: number): number {
  if (explicitScore !== undefined) return clamp(explicitScore);
  switch (status) {
    case ServiceStatus.operational:
      return 4;
    case ServiceStatus.partial_outage:
      return 48;
    case ServiceStatus.major_outage:
      return 86;
    default:
      return 0;
  }
}

export function availabilityForStatus(status: ServiceStatus): number {
  switch (status) {
    case ServiceStatus.operational:
      return 99;
    case ServiceStatus.partial_outage:
      return 78;
    case ServiceStatus.major_outage:
      return 38;
    default:
      return 0;
  }
}

export function calculateOngoingDuration(
  checks: Array<{ checkedAt: Date; status: ServiceStatus }>
): number | null {
  const sorted = [...checks].sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());
  const latest = sorted[0];
  if (!latest || latest.status === ServiceStatus.operational || latest.status === ServiceStatus.unknown) {
    return null;
  }

  let startedAt = latest.checkedAt;
  for (const check of sorted.slice(1)) {
    if (check.status === latest.status || check.status === ServiceStatus.partial_outage || check.status === ServiceStatus.major_outage) {
      startedAt = check.checkedAt;
      continue;
    }
    break;
  }

  return Date.now() - startedAt.getTime();
}

export function calculateCurrentStatusDuration(
  checks: Array<{ checkedAt: Date; status: ServiceStatus }>
): number | null {
  const sorted = [...checks].sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());
  const latest = sorted[0];
  if (!latest) {
    return null;
  }

  let startedAt = latest.checkedAt;
  for (const check of sorted.slice(1)) {
    if (check.status !== latest.status) {
      break;
    }
    startedAt = check.checkedAt;
  }

  return Date.now() - startedAt.getTime();
}

export function calculateUptimePercent(
  checks: Array<{ status: ServiceStatus }>
): { percent: number | null; samples: number } {
  const meaningfulChecks = checks.filter((check) => check.status !== ServiceStatus.unknown);
  if (meaningfulChecks.length === 0) {
    return { percent: null, samples: 0 };
  }

  const successfulChecks = meaningfulChecks.filter((check) => check.status === ServiceStatus.operational).length;
  return {
    percent: round((successfulChecks / meaningfulChecks.length) * 100, 1),
    samples: meaningfulChecks.length
  };
}

export function detectAnomaly(latestScore: number, previousScores: number[]): boolean {
  if (previousScores.length < 8) return false;
  const baseline = previousScores.reduce((sum, value) => sum + value, 0) / previousScores.length;
  const variance =
    previousScores.reduce((sum, value) => sum + (value - baseline) ** 2, 0) / previousScores.length;
  const deviation = Math.sqrt(variance);
  return latestScore >= baseline + Math.max(18, deviation * 2.4);
}

function buildAggregate(
  signals: SourceSignal[],
  status: ServiceStatus,
  problemScore: number,
  availability: number,
  quality: AggregatedStatus["quality"]
): AggregatedStatus {
  const confidence = clamp(
    signals.reduce((sum, signal) => sum + signal.confidence, 0) / Math.max(1, signals.length),
    0,
    1
  );
  const source = signals.length === 1 ? signals[0].source : "mixed";
  const affectedRegions = unique(signals.flatMap((signal) => signal.affectedRegions));
  const suspectedReasons = unique(signals.flatMap((signal) => signal.suspectedReasons)).slice(0, 5);

  return {
    status,
    availability: clamp(availability),
    problemScore: clamp(problemScore),
    confidence: round(confidence, 2),
    affectedRegions,
    suspectedReasons,
    message: explain(status, problemScore, quality, suspectedReasons, affectedRegions),
    source,
    quality,
    raw: {
      signals,
      scoreBreakdown: signals.map((signal) => ({
        source: signal.source,
        problemScore: signal.problemScore ?? null,
        confidence: signal.confidence,
        quality: signal.quality
      }))
    }
  };
}

function explain(
  status: ServiceStatus,
  problemScore: number,
  quality: AggregatedStatus["quality"],
  reasons: string[],
  regions: string[]
): string {
  if (quality === "insufficient" || status === ServiceStatus.unknown) {
    return "Недостаточно надежных сигналов, статус не подтвержден.";
  }

  const reason = reasons[0] ? ` Вероятная причина: ${reasons[0]}.` : "";
  const region = regions.length ? ` Затронуты: ${regions.join(", ")}.` : "";

  if (status === ServiceStatus.major_outage) {
    return `Высокий уровень жалоб и технических сигналов (${Math.round(problemScore)}%).${reason}${region}`;
  }

  if (status === ServiceStatus.partial_outage) {
    return `Зафиксирована деградация, проблема выражена умеренно (${Math.round(problemScore)}%).${reason}${region}`;
  }

  return "Критичных аномалий не обнаружено, сервис отвечает в пределах нормы.";
}

function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
