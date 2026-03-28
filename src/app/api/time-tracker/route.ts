import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trackers = await prisma.timeTracker.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
    include: {
      members: {
        include: {
          entries: { select: { id: true, date: true, minutes: true } },
        },
      },
    },
  });

  return NextResponse.json(trackers);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const count = await prisma.timeTracker.count({ where: { userId: session.user.id } });

    const tracker = await prisma.timeTracker.create({
      data: { name: name.trim(), userId: session.user.id, order: count },
    });

    return NextResponse.json(tracker, { status: 201 });
  } catch (error) {
    console.error("Error creating time tracker:", error);
    return NextResponse.json({ error: "Failed to create tracker", details: String(error) }, { status: 500 });
  }
}
