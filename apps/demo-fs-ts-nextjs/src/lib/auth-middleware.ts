import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type JwtClaims } from "./jwt";
import type { SessionRepository } from "@/repositories/interfaces";

export async function requireAuth(req: NextRequest, sessions: SessionRepository): Promise<JwtClaims | NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Missing Authorization header" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const claims = await verifyToken(token);
  if (!claims) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }

  if (claims.tokenType !== "access") {
    return NextResponse.json({ message: "Not an access token" }, { status: 401 });
  }

  const isRevoked = await sessions.isAccessTokenRevoked(claims.jti);
  if (isRevoked) {
    return NextResponse.json({ message: "Token has been revoked" }, { status: 401 });
  }

  // Check user status
  const repos = await (await import("@/repositories")).getRepositories();
  const user = await repos.users.findById(claims.sub);
  if (!user || user.status === "DISABLED" || user.status === "INACTIVE" || user.status === "LOCKED") {
    return NextResponse.json({ message: "Account is not active" }, { status: 401 });
  }

  return claims;
}

export async function requireAdmin(req: NextRequest, sessions: SessionRepository): Promise<JwtClaims | NextResponse> {
  const result = await requireAuth(req, sessions);
  if (result instanceof NextResponse) return result;

  if (result.role !== "ADMIN") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  return result;
}

export function serviceResponse<T>(
  result: { ok: true; data: T } | { ok: false; error: string; status: number },
  successStatus = 200,
): NextResponse {
  if (result.ok) {
    return NextResponse.json(result.data, { status: successStatus });
  }
  return NextResponse.json({ message: result.error }, { status: result.status });
}
