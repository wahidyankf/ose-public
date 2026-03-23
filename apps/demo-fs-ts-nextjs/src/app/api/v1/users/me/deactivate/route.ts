import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { deactivateAccount } from "@/services/user-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const result = await deactivateAccount(repos, authResult.sub);
  return serviceResponse(result);
}
