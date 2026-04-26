import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
      },
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Set JWT as HTTP-only cookie for .vutera.net domain
    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      { status: 201 }
    );

    // Set cookie with .vutera.net domain to be accessible across subdomains
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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
