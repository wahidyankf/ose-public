import { NextRequest, NextResponse } from "next/server";
import { Effect, Exit } from "effect";
import { AuthService, AuthServiceLive } from "@/services/auth-service";
import { BackendClientLive } from "@/layers/backend-client-live";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("organiclever_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const program = Effect.gen(function* () {
    const authService = yield* AuthService;
    return yield* authService.refresh(refreshToken);
  }).pipe(Effect.provideService(AuthService, AuthServiceLive), Effect.provide(BackendClientLive));

  const exit = await Effect.runPromiseExit(program);

  if (!Exit.isSuccess(exit)) {
    const response = NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const tokens = exit.value;
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

  return response;
}
