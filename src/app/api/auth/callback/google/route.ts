import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Authorization code not provided" }, { status: 400 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 400 });
    }

    // 2. Get user info using access token
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();
    if (!userResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch user info from Google" }, { status: 400 });
    }

    // 3. Find or create user in DB
    let user = await prisma.user.findUnique({
      where: { ssoId: googleUser.sub },
    });

    if (!user) {
      // Try to find by email
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Update user with ssoId
        user = await prisma.user.update({
          where: { id: user.id },
          data: { ssoId: googleUser.sub },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email!,
            name: googleUser.name,
            ssoId: googleUser.sub,
            emailVerified: new Date(), // Google emails are verified
          },
        });
      }
    }

    // 4. Generate our own session token
    const token = generateToken(user.id, user.email);

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`);

    // 5. Set session cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      domain: process.env.NODE_ENV === "production" ? ".vutera.net" : "localhost",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
