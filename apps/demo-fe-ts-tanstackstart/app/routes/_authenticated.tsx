import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGuard } from "~/lib/auth/auth-guard";

function AuthenticatedLayout() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
}

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});
