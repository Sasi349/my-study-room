import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const { model, items } = await req.json() as {
    model: "category" | "subject" | "room" | "note" | "link" | "file" | "streak" | "syllabus" | "trackerTopic" | "trackerItem" | "timeTracker";
    items: { id: string; order: number }[];
  };

  if (!model || !items?.length) {
    return NextResponse.json({ error: "model and items required" }, { status: 400 });
  }

  if (!["category", "subject", "room", "note", "link", "file", "streak", "syllabus", "trackerTopic", "trackerItem", "timeTracker"].includes(model)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const { id, order } of items) {
        switch (model) {
          case "category":
            await tx.category.update({ where: { id, userId }, data: { order } });
            break;
          case "subject":
            await tx.subject.update({ where: { id }, data: { order } });
            break;
          case "room":
            await tx.room.update({ where: { id }, data: { order } });
            break;
          case "note":
            await tx.note.update({ where: { id }, data: { order } });
            break;
          case "link":
            await tx.link.update({ where: { id }, data: { order } });
            break;
          case "file":
            await tx.file.update({ where: { id }, data: { order } });
            break;
          case "streak":
            await tx.streak.update({ where: { id, userId }, data: { order } });
            break;
          case "syllabus":
            await tx.syllabus.update({ where: { id, userId }, data: { order } });
            break;
          case "trackerTopic":
            await tx.trackerTopic.update({ where: { id }, data: { order } });
            break;
          case "trackerItem":
            await tx.trackerItem.update({ where: { id }, data: { order } });
            break;
          case "timeTracker":
            await tx.timeTracker.update({ where: { id, userId }, data: { order } });
            break;
        }
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}
