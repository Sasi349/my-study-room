import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { model, items } = await req.json() as {
    model: "category" | "subject" | "room";
    items: { id: string; order: number }[];
  };

  if (!model || !items?.length) {
    return NextResponse.json({ error: "model and items required" }, { status: 400 });
  }

  if (!["category", "subject", "room"].includes(model)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const { id, order } of items) {
      switch (model) {
        case "category":
          await tx.category.update({ where: { id }, data: { order } });
          break;
        case "subject":
          await tx.subject.update({ where: { id }, data: { order } });
          break;
        case "room":
          await tx.room.update({ where: { id }, data: { order } });
          break;
      }
    }
  });

  return NextResponse.json({ success: true });
}
