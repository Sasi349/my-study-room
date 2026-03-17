import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

  const rooms = await prisma.room.findMany({
    where: { subjectId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { notes: true, links: true, files: true } },
    },
  });
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, subjectId } = await req.json();
  if (!name || !subjectId)
    return NextResponse.json({ error: "Name and subjectId required" }, { status: 400 });

  const room = await prisma.room.create({
    data: { name, subjectId },
  });
  return NextResponse.json(room, { status: 201 });
}
