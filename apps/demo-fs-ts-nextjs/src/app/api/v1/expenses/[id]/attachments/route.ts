import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { uploadAttachment, listAttachments } from "@/services/attachment-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const result = await listAttachments(repos, id, authResult.sub);
  if (!result.ok) return serviceResponse(result);
  return NextResponse.json({ attachments: result.data }, { status: 200 });
}

export async function POST(req: NextRequest, { params }: Params) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadAttachment(repos, id, authResult.sub, {
    filename: file.name,
    contentType: file.type,
    size: file.size,
    data: buffer,
  });
  if (!result.ok) return serviceResponse(result);
  return NextResponse.json(
    { ...result.data, url: `/api/v1/expenses/${id}/attachments/${result.data.id}` },
    { status: 201 },
  );
}
