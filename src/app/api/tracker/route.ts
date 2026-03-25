import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const syllabi = await prisma.syllabus.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
    include: {
      members: {
        include: {
          progress: { select: { itemId: true } },
        },
      },
      topics: {
        include: {
          _count: { select: { items: true } },
        },
      },
    },
  });

  return NextResponse.json(syllabi);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const count = await prisma.syllabus.count({ where: { userId: session.user.id } });

  const syllabus = await prisma.syllabus.create({
    data: { name: name.trim(), userId: session.user.id, order: count },
  });

  return NextResponse.json(syllabus, { status: 201 });
}
