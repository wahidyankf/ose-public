import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories";

export async function POST() {
  if (process.env.ENABLE_TEST_API !== "true") {
    return NextResponse.json({ message: "Test API is disabled" }, { status: 404 });
  }

  const repos = getRepositories();
  await repos.attachments.deleteAll();
  await repos.expenses.deleteAll();
  await repos.sessions.deleteAll();
  await repos.users.deleteAll();

  return NextResponse.json({ message: "Database reset" });
}
