import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );

    // Clear auth_token cookie
    response.cookies.set({
      name: "auth_token",
      value: "",
      maxAge: 0,
      domain: process.env.NODE_ENV === "production" ? ".vutera.net" : "localhost",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
