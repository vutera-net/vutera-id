import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Delete the user (Profile will be deleted due to Cascade delete in schema)
    await prisma.user.delete({
      where: { id: payload.userId },
    });

    const response = NextResponse.json({ message: "Account successfully deleted" });
    
    // Clear the auth cookie
    response.cookies.set({
      name: "auth_token",
      value: "",
      maxAge: 0,
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".vutera.net" : "localhost",
    });

    return response;
  } catch (error) {
    console.error("Delete Account Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
