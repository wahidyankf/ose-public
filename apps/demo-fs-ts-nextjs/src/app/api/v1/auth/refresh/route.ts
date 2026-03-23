import { NextRequest } from "next/server";
import { getRepositories } from "@/repositories";
import { refresh } from "@/services/auth-service";
import { serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const repos = await getRepositories();
  const refreshToken = body.refreshToken ?? body.refresh_token ?? "";
  const result = await refresh(repos, refreshToken);
  return serviceResponse(result);
}
