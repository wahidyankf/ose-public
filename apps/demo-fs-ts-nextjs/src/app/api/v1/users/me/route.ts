import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { getProfile, updateDisplayName } from "@/services/user-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const result = await getProfile(repos, authResult.sub);
  return serviceResponse(result);
}

export async function PATCH(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const result = await updateDisplayName(repos, authResult.sub, body.displayName ?? "");
  return serviceResponse(result);
}
