import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header or cookie
    let token: string | null = null;

    // Try Authorization header first
    const authHeader = request.headers.get("Authorization");
    token = extractToken(authHeader);

    // Try cookie if no Authorization header
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Fetch user with profile data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profile: user.profile || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
