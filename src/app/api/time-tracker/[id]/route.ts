import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tracker = await prisma.timeTracker.findFirst({
    where: { id, userId: session.user.id },
    include: {
      members: {
        include: {
          entries: {
            orderBy: { date: "desc" },
          },
        },
      },
    },
  });

  if (!tracker) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(tracker);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();

  const existing = await prisma.timeTracker.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tracker = await prisma.timeTracker.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json(tracker);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.timeTracker.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.timeTracker.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
