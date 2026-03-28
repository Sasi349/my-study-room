import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { memberId, date, minutes, note } = body;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!memberId || !date || !minutes || minutes <= 0 || !dateRegex.test(date)) {
    return NextResponse.json({ error: "memberId, date (YYYY-MM-DD), and positive minutes required" }, { status: 400 });
  }

  const member = await prisma.timeTrackerMember.findUnique({
    where: { id: memberId },
    include: { tracker: { select: { userId: true } } },
  });
  if (!member || member.tracker.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = await prisma.timeEntry.create({
    data: {
      date,
      minutes,
      note: note?.trim() || null,
      memberId,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
