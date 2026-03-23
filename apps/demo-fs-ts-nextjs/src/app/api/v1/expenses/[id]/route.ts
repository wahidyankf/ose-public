import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { getExpense, updateExpense, deleteExpense } from "@/services/expense-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const result = await getExpense(repos, id, authResult.sub);
  return serviceResponse(result);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await req.json();
  const result = await updateExpense(repos, id, authResult.sub, body);
  return serviceResponse(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const result = await deleteExpense(repos, id, authResult.sub);
  if (result.ok) return new NextResponse(null, { status: 204 });
  return serviceResponse(result);
}
