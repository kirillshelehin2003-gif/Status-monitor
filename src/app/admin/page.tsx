import { AdminPanelClient } from "@/components/admin/admin-panel-client";
import { getAdminSnapshot } from "@/server/services/snapshots";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await getAdminSnapshot();
  return <AdminPanelClient initialSnapshot={snapshot} />;
}
