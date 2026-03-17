import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const links = await prisma.link.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, url, roomId } = await req.json();
  if (!url || !roomId)
    return NextResponse.json({ error: "URL and roomId required" }, { status: 400 });

  const link = await prisma.link.create({
    data: { title, url, roomId },
  });
  return NextResponse.json(link, { status: 201 });
}
