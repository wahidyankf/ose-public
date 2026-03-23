import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { generatePLReport } from "@/services/report-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const currency = url.searchParams.get("currency") ?? undefined;

  const result = await generatePLReport(repos, authResult.sub, from, to, currency);
  return serviceResponse(result);
}
