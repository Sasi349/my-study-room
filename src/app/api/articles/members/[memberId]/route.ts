import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const member = await prisma.articleMember.findFirst({ where: { id: memberId, userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.articleMember.update({
    where: { id: memberId },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await params;

  const member = await prisma.articleMember.findFirst({ where: { id: memberId, userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete children first rather than relying on SQLite foreign-key cascades
  await prisma.$transaction([
    prisma.articleProgress.deleteMany({ where: { memberId } }),
    prisma.articleMember.delete({ where: { id: memberId } }),
  ]);

  return NextResponse.json({ success: true });
}
