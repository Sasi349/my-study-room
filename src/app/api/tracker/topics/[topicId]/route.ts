import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;
  const { name } = await req.json();

  const topic = await prisma.trackerTopic.findUnique({
    where: { id: topicId },
    include: { syllabus: { select: { userId: true } } },
  });
  if (!topic || topic.syllabus.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.trackerTopic.update({
    where: { id: topicId },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;

  const topic = await prisma.trackerTopic.findUnique({
    where: { id: topicId },
    include: { syllabus: { select: { userId: true } } },
  });
  if (!topic || topic.syllabus.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trackerTopic.delete({ where: { id: topicId } });

  return NextResponse.json({ success: true });
}
