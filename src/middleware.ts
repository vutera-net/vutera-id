import { NextRequest, NextResponse } from "next/server";

// Các trang chỉ dành cho user chưa đăng nhập
const AUTH_PAGES = ["/", "/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Đã đăng nhập mà vào trang auth → chuyển thẳng vào profile (hoặc trang redirect nếu có)
  if (token && AUTH_PAGES.includes(pathname)) {
    const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/auth/profile";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/login", "/auth/register"],
};
