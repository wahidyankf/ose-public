import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { disableUser } from "@/services/user-service";
import { requireAdmin, serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const repos = await getRepositories();
  const authResult = await requireAdmin(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const result = await disableUser(repos, id);
  return serviceResponse(result);
}
