import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const { date, minutes, note, startTime, endTime } = await req.json();

  const timeRegex = /^\d{2}:\d{2}$/;
  if (startTime != null && !timeRegex.test(startTime)) {
    return NextResponse.json({ error: "startTime must be HH:MM" }, { status: 400 });
  }
  if (endTime != null && !timeRegex.test(endTime)) {
    return NextResponse.json({ error: "endTime must be HH:MM" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: { member: { include: { tracker: { select: { userId: true } } } } },
  });
  if (!entry || entry.member.tracker.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      ...(date && { date }),
      ...(minutes && minutes > 0 && { minutes }),
      ...(startTime !== undefined && { startTime: startTime ?? null }),
      ...(endTime !== undefined && { endTime: endTime ?? null }),
      ...(note !== undefined && { note: note?.trim() || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: { member: { include: { tracker: { select: { userId: true } } } } },
  });
  if (!entry || entry.member.tracker.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.timeEntry.delete({ where: { id: entryId } });

  return NextResponse.json({ success: true });
}
