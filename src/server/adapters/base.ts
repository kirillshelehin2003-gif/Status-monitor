import type { CheckSource, Service, ServiceStatus } from "@prisma/client";

export type SourceQuality = "complete" | "partial" | "insufficient";

export type SourceSignal = {
  source: CheckSource;
  status?: ServiceStatus;
  checkedAt: Date;
  availability?: number;
  latencyMs?: number;
  problemScore?: number;
  confidence: number;
  quality: SourceQuality;
  affectedRegions: string[];
  suspectedReasons: string[];
  message: string;
  raw?: unknown;
};

export type MonitorContext = {
  now: Date;
};

export interface MonitorAdapter {
  readonly name: string;
  readonly source: CheckSource;
  collect(service: Service, context: MonitorContext): Promise<SourceSignal>;
}

export function insufficientSignal(
  source: CheckSource,
  message: string,
  raw?: unknown
): SourceSignal {
  return {
    source,
    checkedAt: new Date(),
    confidence: 0,
    quality: "insufficient",
    affectedRegions: [],
    suspectedReasons: [],
    message,
    raw
  };
}
