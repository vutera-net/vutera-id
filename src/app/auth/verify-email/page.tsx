"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Liên kết xác thực không hợp lệ.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Chúc mừng! Email của bạn đã được xác thực thành công.");
        } else {
          setStatus("error");
          setMessage(data.error || "Xác thực thất bại. Vui lòng thử lại.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Đã xảy ra lỗi trong quá trình xác thực.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {status === "loading" && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-slate-900">Đang xác thực email...</h1>
            </div>
          )}

          {status === "success" && (
            <div>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Xác thực thành công!</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link
                href="/auth/login"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {status === "error" && (
            <div>
              <div className="text-red-500 text-5xl mb-4">✕</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Xác thực thất bại</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link
                href="/auth/forgot-password"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Yêu cầu gửi lại email
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">Đang tải...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
