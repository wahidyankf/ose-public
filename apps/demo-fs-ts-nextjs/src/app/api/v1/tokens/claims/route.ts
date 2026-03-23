import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json({
    sub: authResult.sub,
    username: authResult.username,
    role: authResult.role,
    jti: authResult.jti,
    iat: authResult.iat,
    exp: authResult.exp,
    iss: authResult.iss,
  });
}
