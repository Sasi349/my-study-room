import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { isImageMimeType } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const files = await prisma.file.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as globalThis.File | null;
  const roomId = formData.get("roomId") as string | null;

  if (!file || !roomId)
    return NextResponse.json({ error: "File and roomId required" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isImage = isImageMimeType(file.type);
  const subDir = isImage ? "images" : "files";
  const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const key = `uploads/${subDir}/${uniqueName}`;

  // Upload to Cloudflare R2
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  const dbFile = await prisma.file.create({
    data: {
      name: file.name,
      path: publicUrl,
      size: buffer.length,
      mimeType: file.type,
      type: isImage ? "image" : "file",
      roomId,
    },
  });

  return NextResponse.json(dbFile, { status: 201 });
}
