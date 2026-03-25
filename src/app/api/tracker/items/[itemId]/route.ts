import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const { name } = await req.json();

  const item = await prisma.trackerItem.findUnique({
    where: { id: itemId },
    include: { topic: { include: { syllabus: { select: { userId: true } } } } },
  });
  if (!item || item.topic.syllabus.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.trackerItem.update({
    where: { id: itemId },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.trackerItem.findUnique({
    where: { id: itemId },
    include: { topic: { include: { syllabus: { select: { userId: true } } } } },
  });
  if (!item || item.topic.syllabus.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trackerItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
