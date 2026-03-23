import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { logoutAll } from "@/services/auth-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const result = await logoutAll(repos, authResult.sub, authResult.jti);
  return serviceResponse(result);
}
