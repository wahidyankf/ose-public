import { apiFetch } from "./client";
import type { PLReport } from "./types";

export function getPLReport(startDate: string, endDate: string, currency: string): Promise<PLReport> {
  const params = new URLSearchParams({
    startDate,
    endDate,
    currency,
  });
  return apiFetch<PLReport>(`/api/v1/reports/pl?${params}`);
}
