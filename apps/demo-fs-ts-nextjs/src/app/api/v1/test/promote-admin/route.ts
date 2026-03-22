import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_TEST_API !== "true") {
    return NextResponse.json({ message: "Test API is disabled" }, { status: 404 });
  }

  const body = await req.json();
  const username = body.username as string;
  if (!username) {
    return NextResponse.json({ message: "Username is required" }, { status: 400 });
  }

  const repos = getRepositories();
  const user = await repos.users.findByUsername(username);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  await repos.users.updateStatus(user.id, "ACTIVE");
  // Promote to admin by directly updating the role via raw update
  const { db } = await import("@/db/client");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(users).set({ role: "ADMIN" }).where(eq(users.id, user.id));

  return NextResponse.json({ message: `User ${username} promoted to ADMIN` });
}
