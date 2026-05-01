import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/auth";
import { ProfileSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    let token: string | null = null;
    const authHeader = request.headers.get("Authorization");
    token = extractToken(authHeader);
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate profile data
    const validation = ProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { fullName, gender, birthDate, birthTime, birthTimezone, birthLocation } =
      validation.data;

    // Prepare update data (only include provided fields)
    const updateData: Record<string, any> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (gender !== undefined) updateData.gender = gender;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (birthTime !== undefined) updateData.birthTime = birthTime;
    if (birthTimezone !== undefined) updateData.birthTimezone = birthTimezone;
    if (birthLocation !== undefined) updateData.birthLocation = birthLocation;

    // Upsert profile
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
    });

    if (!existingProfile && (!gender || !birthDate)) {
      return NextResponse.json(
        { error: "Cần có giới tính và ngày sinh để tạo hồ sơ lần đầu" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.upsert({
      where: { userId: payload.userId },
      update: updateData,
      create: {
        userId: payload.userId,
        gender: gender || "MALE", // Fallback if not provided but exists in DB (though we checked above)
        birthDate: birthDate ? new Date(birthDate) : new Date(), // Fallback
        ...updateData,
      },
    });

    // Audit logging for sensitive changes
    if (existingProfile) {
      const logs: any[] = [];
      const sensitiveFields = ["birthTime", "birthDate", "gender"];
      
      for (const field of sensitiveFields) {
        const oldValue = (existingProfile as any)[field];
        const newValue = (profile as any)[field];
        
        if (oldValue !== newValue) {
          logs.push({
            userId: payload.userId,
            action: "UPDATE_PROFILE",
            field,
            oldValue: String(oldValue),
            newValue: String(newValue),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          });
        }
      }

      if (logs.length > 0) {
        await prisma.auditLog.createMany({ data: logs });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
