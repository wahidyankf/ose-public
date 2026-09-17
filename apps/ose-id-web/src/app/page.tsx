import { foundationStatusReport } from "@/contexts/foundation/application/service-status";
import { ServiceStatusPanel } from "@/contexts/foundation/presentation/service-status-panel";

// Every read re-reads. Nothing is cached, so a stale page can never report a health the service
// no longer has.
export const dynamic = "force-dynamic";

export default function StatusPage() {
  return <ServiceStatusPanel report={foundationStatusReport()} />;
}
