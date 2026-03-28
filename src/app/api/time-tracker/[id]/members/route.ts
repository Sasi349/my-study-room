import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const tracker = await prisma.timeTracker.findFirst({ where: { id, userId: session.user.id } });
  if (!tracker) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.timeTrackerMember.create({
    data: { name: name.trim(), trackerId: id },
  });

  return NextResponse.json(member, { status: 201 });
}
