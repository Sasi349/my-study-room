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

  const syllabus = await prisma.syllabus.findFirst({
    where: { id, userId: session.user.id },
    include: {
      members: {
        include: {
          progress: { select: { id: true, itemId: true } },
        },
      },
      topics: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              progress: { select: { id: true, memberId: true } },
            },
          },
        },
      },
    },
  });

  if (!syllabus) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(syllabus);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();

  // Verify ownership
  const existing = await prisma.syllabus.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const syllabus = await prisma.syllabus.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json(syllabus);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.syllabus.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.syllabus.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
