import { NextRequest, NextResponse } from "next/server";
import { Effect, Exit } from "effect";
import { AuthService, AuthServiceLive } from "@/services/auth-service";
import { BackendClientLive } from "@/layers/backend-client-live";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;

  if (!body?.idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  const program = Effect.gen(function* () {
    const authService = yield* AuthService;
    return yield* authService.googleLogin(body.idToken as string);
  }).pipe(Effect.provideService(AuthService, AuthServiceLive), Effect.provide(BackendClientLive));

  const exit = await Effect.runPromiseExit(program);

  if (!Exit.isSuccess(exit)) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  const tokens = exit.value;
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

  return response;
}
