import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const membersFilePath = path.join(process.cwd(), "src/data/members.json");

export async function GET() {
  try {
    const membersData = await fs.readFile(membersFilePath, "utf-8");
    const members: Member[] = JSON.parse(membersData);
    return NextResponse.json(members);
  } catch (error) {
    console.error("Error reading members data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newMember = await request.json();
    const membersData = await fs.readFile(membersFilePath, "utf-8");
    const members: Member[] = JSON.parse(membersData);

    newMember.id = Math.max(...members.map((m) => m.id), 0) + 1;
    members.push(newMember);

    await fs.writeFile(membersFilePath, JSON.stringify(members, null, 2));
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error creating new member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

interface Member {
  id: number;
  name: string;
  role: string;
  email?: string;
  github: string;
}
