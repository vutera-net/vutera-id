import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, generateToken } from "@/lib/auth";
import { LoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Set JWT as HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      { status: 200 }
    );

    // Set cookie with .vutera.net domain
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      domain:
        process.env.NODE_ENV === "production"
          ? ".vutera.net"
          : "localhost",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
