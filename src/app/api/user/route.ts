import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getUser() {
  const session = await auth();
  if (!session?.user) return null;

  // Try by ID first, fallback to finding by name
  if (session.user.id) {
    return prisma.user.findUnique({ where: { id: session.user.id } });
  }

  // Fallback: find first user (for single-user app)
  return prisma.user.findFirst();
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    name: user.name,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, currentPassword, newPassword } = await req.json();

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const updateData: { username?: string; password?: string } = {};

  if (username && username !== user.username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    updateData.username = username;
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return NextResponse.json({ success: true, message: "Account updated. Please sign in again." });
}
