import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { changePassword } from "@/services/user-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const result = await changePassword(repos, authResult.sub, {
    currentPassword: body.oldPassword ?? body.currentPassword,
    newPassword: body.newPassword,
  });
  return serviceResponse(result);
}
