import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streaks = await prisma.streak.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 60,
      },
    },
  });

  return NextResponse.json(streaks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const count = await prisma.streak.count({ where: { userId: session.user.id } });

  const streak = await prisma.streak.create({
    data: { name: name.trim(), userId: session.user.id, order: count },
  });

  return NextResponse.json(streak, { status: 201 });
}
