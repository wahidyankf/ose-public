import { readServiceStatusReport } from "@/contexts/foundation/application/service-status-source";
import { ServiceStatusPanel } from "@/contexts/foundation/presentation/service-status-panel";

// Every read re-reads. Nothing is cached, so a stale page can never report a health the service
// no longer has, and reloading the page is the whole of the "check again" gesture — there is no
// refresh control, because a control would imply this page holds something between requests.
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  return <ServiceStatusPanel report={await readServiceStatusReport()} />;
}
