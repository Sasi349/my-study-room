import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  const link = await prisma.link.update({
    where: { id },
    data: { title: title?.trim() || null, url: url.trim() },
  });
  return NextResponse.json(link);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.link.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
