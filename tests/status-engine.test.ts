import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CheckSource, ServiceStatus } from "@prisma/client";
import { aggregateSignals, calculateOngoingDuration, chooseStatus, detectAnomaly } from "../src/server/services/status-engine";
import type { SourceSignal } from "../src/server/adapters/base";

function signal(partial: Partial<SourceSignal>): SourceSignal {
  return {
    source: CheckSource.dev_mock,
    checkedAt: new Date(),
    confidence: 0.7,
    quality: "complete",
    affectedRegions: [],
    suspectedReasons: [],
    message: "test",
    ...partial
  };
}

describe("status engine", () => {
  it("returns unknown when there are no useful signals", () => {
    const aggregate = aggregateSignals([
      signal({ quality: "insufficient", confidence: 0, problemScore: undefined, status: undefined })
    ]);

    assert.equal(aggregate.status, ServiceStatus.unknown);
    assert.equal(aggregate.quality, "insufficient");
  });

  it("lets manual override win over other sources", () => {
    const aggregate = aggregateSignals([
      signal({ source: CheckSource.http_health, status: ServiceStatus.operational, problemScore: 2 }),
      signal({ source: CheckSource.manual_admin, status: ServiceStatus.major_outage, problemScore: 90 })
    ]);

    assert.equal(aggregate.status, ServiceStatus.major_outage);
    assert.equal(aggregate.source, CheckSource.manual_admin);
  });

  it("classifies partial and major outages by score and availability", () => {
    assert.equal(chooseStatus(12, 99), ServiceStatus.operational);
    assert.equal(chooseStatus(38, 96), ServiceStatus.partial_outage);
    assert.equal(chooseStatus(74, 88), ServiceStatus.major_outage);
    assert.equal(chooseStatus(18, 52), ServiceStatus.major_outage);
  });

  it("calculates ongoing degradation duration from consecutive non-operational checks", () => {
    const now = Date.now();
    const duration = calculateOngoingDuration([
      { checkedAt: new Date(now), status: ServiceStatus.partial_outage },
      { checkedAt: new Date(now - 60_000), status: ServiceStatus.partial_outage },
      { checkedAt: new Date(now - 120_000), status: ServiceStatus.major_outage },
      { checkedAt: new Date(now - 180_000), status: ServiceStatus.operational }
    ]);

    assert.ok(duration !== null && duration >= 120_000);
  });

  it("detects a score anomaly against a stable baseline", () => {
    assert.equal(detectAnomaly(62, [8, 9, 11, 10, 8, 12, 9, 10, 11]), true);
    assert.equal(detectAnomaly(14, [8, 9, 11, 10, 8, 12, 9, 10, 11]), false);
  });
});
