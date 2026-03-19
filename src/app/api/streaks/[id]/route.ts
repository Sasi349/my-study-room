import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();

  const streak = await prisma.streak.update({
    where: { id },
    data: { name: name.trim() },
  });
  return NextResponse.json(streak);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.streak.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// Toggle today's check-in
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { date } = await req.json();

  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  // Check if log exists for this date
  const existing = await prisma.streakLog.findUnique({
    where: { streakId_date: { streakId: id, date } },
  });

  if (existing) {
    await prisma.streakLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ checked: false });
  } else {
    await prisma.streakLog.create({ data: { streakId: id, date } });
    return NextResponse.json({ checked: true });
  }
}
