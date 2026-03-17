import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const notes = await prisma.note.findMany({
    where: { roomId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, roomId } = await req.json();
  if (!content || !roomId)
    return NextResponse.json({ error: "Content and roomId required" }, { status: 400 });

  const note = await prisma.note.create({
    data: { title, content, roomId },
  });
  return NextResponse.json(note, { status: 201 });
}
