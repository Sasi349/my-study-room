import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const existingUser = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existingUser) {
    return NextResponse.json({ message: "Admin user already exists" });
  }

  const hash = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: { username: "admin", password: hash, name: "Admin" },
  });

  return NextResponse.json({
    message: "Admin user created",
    credentials: { username: "admin", password: "admin123" },
  });
}
