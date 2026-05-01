import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/auth";

async function isAdmin(request: NextRequest) {
  let token: string | null = null;
  const authHeader = request.headers.get("Authorization");
  token = extractToken(authHeader);
  if (!token) {
    token = request.cookies.get("auth_token")?.value || null;
  }

  if (!token) return false;
  const payload = verifyToken(token);
  if (!payload) return false;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user?.role === "ADMIN";
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
