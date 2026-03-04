import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const membersFilePath = path.join(process.cwd(), "src/data/members.json");

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const membersData = await fs.readFile(membersFilePath, "utf-8");
    const members: Member[] = JSON.parse(membersData);
    const member = members.find((m) => m.id === parseInt(id));

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error reading member data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updatedMember = await request.json();
    const membersData = await fs.readFile(membersFilePath, "utf-8");
    const members: Member[] = JSON.parse(membersData);

    const index = members.findIndex((m) => m.id === parseInt(id));
    if (index === -1) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    members[index] = { ...members[index], ...updatedMember };
    await fs.writeFile(membersFilePath, JSON.stringify(members, null, 2));
    return NextResponse.json(members[index]);
  } catch (error) {
    console.error("Error updating member:", error);
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const membersData = await fs.readFile(membersFilePath, "utf-8");
    const members: Member[] = JSON.parse(membersData);

    const index = members.findIndex((m: Member) => m.id === parseInt(id));
    if (index === -1) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    members.splice(index, 1);
    await fs.writeFile(membersFilePath, JSON.stringify(members, null, 2));
    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
