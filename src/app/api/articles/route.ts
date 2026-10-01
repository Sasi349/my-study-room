import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_ARTICLE_IDS } from "@/lib/constitution-articles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.articleMember.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { progress: { select: { articleId: true } } },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      completed: m.progress.map((p) => p.articleId),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, articleId, completed } = await req.json();
  if (typeof memberId !== "string" || typeof articleId !== "string" || !ALL_ARTICLE_IDS.has(articleId) || typeof completed !== "boolean") {
    return NextResponse.json({ error: "Valid memberId, articleId and completed required" }, { status: 400 });
  }

  const member = await prisma.articleMember.findFirst({ where: { id: memberId, userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Set explicitly (not toggle) so repeated taps or retries stay consistent
  if (completed) {
    await prisma.articleProgress.upsert({
      where: { memberId_articleId: { memberId, articleId } },
      create: { memberId, articleId },
      update: {},
    });
  } else {
    await prisma.articleProgress.deleteMany({ where: { memberId, articleId } });
  }

  return NextResponse.json({ memberId, articleId, completed });
}
