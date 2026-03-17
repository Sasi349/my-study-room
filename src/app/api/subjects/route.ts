import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categoryId = req.nextUrl.searchParams.get("categoryId");
  if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });

  const subjects = await prisma.subject.findMany({
    where: { categoryId },
    orderBy: { order: "asc" },
    include: { _count: { select: { rooms: true } } },
  });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, categoryId } = await req.json();
  if (!name || !categoryId)
    return NextResponse.json({ error: "Name and categoryId required" }, { status: 400 });

  const subject = await prisma.subject.create({
    data: { name, categoryId },
  });
  return NextResponse.json(subject, { status: 201 });
}
