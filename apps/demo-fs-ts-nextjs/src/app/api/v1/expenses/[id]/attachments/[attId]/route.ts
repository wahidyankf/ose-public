import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { getAttachment, deleteAttachment } from "@/services/attachment-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

type Params = { params: Promise<{ id: string; attId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id, attId } = await params;
  const result = await getAttachment(repos, id, attId, authResult.sub);
  return serviceResponse(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id, attId } = await params;
  const result = await deleteAttachment(repos, id, attId, authResult.sub);
  if (result.ok) return new NextResponse(null, { status: 204 });
  return serviceResponse(result);
}
