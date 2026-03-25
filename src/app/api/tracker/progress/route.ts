import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, itemId } = await req.json();
  if (!memberId || !itemId) {
    return NextResponse.json({ error: "memberId and itemId required" }, { status: 400 });
  }

  // Verify ownership through member -> syllabus -> userId
  const member = await prisma.trackerMember.findUnique({
    where: { id: memberId },
    include: { syllabus: { select: { userId: true } } },
  });
  if (!member || member.syllabus.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Toggle: if exists delete, if not create
  const existing = await prisma.trackerProgress.findUnique({
    where: { memberId_itemId: { memberId, itemId } },
  });

  if (existing) {
    await prisma.trackerProgress.delete({ where: { id: existing.id } });
    return NextResponse.json({ checked: false });
  } else {
    await prisma.trackerProgress.create({ data: { memberId, itemId } });
    return NextResponse.json({ checked: true });
  }
}
