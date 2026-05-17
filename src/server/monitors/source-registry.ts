import type { PrismaClient } from "@prisma/client";
import type { MonitorAdapter } from "@/server/adapters/base";
import { DevTrendAdapter } from "@/server/adapters/dev-trend-adapter";
import { HttpHealthAdapter } from "@/server/adapters/http-health-adapter";
import { ManualOverrideAdapter } from "@/server/adapters/manual-override-adapter";
import { OfficialStatusAdapter } from "@/server/adapters/official-status-adapter";
import { RssSocialSignalAdapter } from "@/server/adapters/rss-social-adapter";
import { UserReportAdapter } from "@/server/adapters/user-report-adapter";

export function createSourceRegistry(db: PrismaClient): MonitorAdapter[] {
  return [
    new ManualOverrideAdapter(db),
    new OfficialStatusAdapter(),
    new HttpHealthAdapter(),
    new UserReportAdapter(db),
    new RssSocialSignalAdapter(),
    new DevTrendAdapter()
  ];
}
