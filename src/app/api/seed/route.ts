import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  // Create admin user if not exists
  let adminUser = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!adminUser) {
    const hash = await bcrypt.hash("admin123", 12);
    adminUser = await prisma.user.create({
      data: { username: "admin", password: hash, name: "Admin" },
    });
  }

  // Assign any unassigned categories to admin user
  await prisma.category.updateMany({
    where: { userId: "" },
    data: { userId: adminUser.id },
  });

  // Create test user if not exists
  let testUser = await prisma.user.findUnique({
    where: { username: "test@gmail.com" },
  });

  if (!testUser) {
    const testHash = await bcrypt.hash("Test123", 12);
    testUser = await prisma.user.create({
      data: { username: "test@gmail.com", password: testHash, name: "Test User" },
    });
  }

  return NextResponse.json({
    message: "Users ready",
    users: [
      { username: "admin", password: "admin123" },
      { username: "test@gmail.com", password: "Test123" },
    ],
  });
}
