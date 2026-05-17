import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardSnapshot } from "@/server/services/snapshots";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();
  return <DashboardClient initialSnapshot={snapshot} />;
}
