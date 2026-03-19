import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      subject: { include: { category: true } },
      notes: { orderBy: [{ order: "asc" }, { updatedAt: "desc" }] },
      links: { orderBy: [{ order: "asc" }, { createdAt: "desc" }] },
      files: { orderBy: [{ order: "asc" }, { createdAt: "desc" }] },
    },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  return NextResponse.json(room);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();

  const room = await prisma.room.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(room);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
