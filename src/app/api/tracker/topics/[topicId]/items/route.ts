import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const topic = await prisma.trackerTopic.findUnique({
    where: { id: topicId },
    include: { syllabus: { select: { userId: true } } },
  });
  if (!topic || topic.syllabus.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const count = await prisma.trackerItem.count({ where: { topicId } });

  const item = await prisma.trackerItem.create({
    data: { name: name.trim(), topicId, order: count },
  });

  return NextResponse.json(item, { status: 201 });
}
