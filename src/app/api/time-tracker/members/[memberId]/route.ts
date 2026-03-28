import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await params;
  const { name } = await req.json();

  const member = await prisma.timeTrackerMember.findUnique({
    where: { id: memberId },
    include: { tracker: { select: { userId: true } } },
  });
  if (!member || member.tracker.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.timeTrackerMember.update({
    where: { id: memberId },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await params;

  const member = await prisma.timeTrackerMember.findUnique({
    where: { id: memberId },
    include: { tracker: { select: { userId: true } } },
  });
  if (!member || member.tracker.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.timeTrackerMember.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}
