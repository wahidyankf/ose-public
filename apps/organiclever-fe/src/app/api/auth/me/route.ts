import { NextRequest, NextResponse } from "next/server";
import { Effect, Exit } from "effect";
import { AuthService, AuthServiceLive } from "@/services/auth-service";
import { BackendClientLive } from "@/layers/backend-client-live";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("organiclever_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const program = Effect.gen(function* () {
    const authService = yield* AuthService;
    return yield* authService.getProfile(accessToken);
  }).pipe(Effect.provideService(AuthService, AuthServiceLive), Effect.provide(BackendClientLive));

  const exit = await Effect.runPromiseExit(program);

  if (!Exit.isSuccess(exit)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(exit.value);
}
