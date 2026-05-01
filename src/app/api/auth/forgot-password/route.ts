import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateResetToken, sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, we return a success response even if the user doesn't exist
      // to prevent email enumeration.
      return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
    }

    const token = generateResetToken();
    const expires = new Date(Date.now() + 3600000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Please click the link to reset your password: ${resetLink}`,
      html: `<p>You requested a password reset. Please click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
