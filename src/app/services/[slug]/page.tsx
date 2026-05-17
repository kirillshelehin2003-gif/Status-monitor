import { notFound } from "next/navigation";
import { ServiceDetailClient } from "@/components/service/service-detail-client";
import { getServiceDetail } from "@/server/services/snapshots";

export const dynamic = "force-dynamic";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getServiceDetail(slug);
  if (!detail) notFound();
  return <ServiceDetailClient initialDetail={detail} />;
}
