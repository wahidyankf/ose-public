import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Effect, Exit } from "effect";
import { AuthService, AuthServiceLive } from "@/services/auth-service";
import { BackendClientLive } from "@/layers/backend-client-live";
import { ProfileCard } from "@/components/profile-card";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("organiclever_access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const program = Effect.gen(function* () {
    const authService = yield* AuthService;
    return yield* authService.getProfile(accessToken);
  }).pipe(Effect.provideService(AuthService, AuthServiceLive), Effect.provide(BackendClientLive));

  const exit = await Effect.runPromiseExit(program);

  if (!Exit.isSuccess(exit)) {
    redirect("/login");
  }

  const profile = exit.value;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <ProfileCard name={profile.name} email={profile.email} avatarUrl={profile.avatarUrl} />
    </main>
  );
}
