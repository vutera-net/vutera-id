"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/auth/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Nếu đã đăng nhập rồi thì chuyển thẳng vào profile
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) router.replace(redirectUrl);
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Đăng nhập thất bại");
        return;
      }

       router.push(redirectUrl);
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">Đang kiểm tra...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
           <div className="bg-white rounded-xl shadow-lg p-8">
             <div className="flex justify-center mb-6">
               <img src="/logo.png" alt="Vutera Logo" className="h-12 w-auto" />
             </div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">
               Vutera Account
             </h1>
             <p className="text-slate-600 mb-6 text-center">Quản lý định danh cho hệ sinh thái Vutera</p>


          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

           <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">
                 Email
               </label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="w-full px-4 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                 placeholder="email@example.com"
               />
             </div>
 
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">
                 Mật khẩu
               </label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 className="w-full px-4 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                 placeholder="••••••••"
               />
             </div>
 
             <button
               type="submit"
               disabled={loading}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
             >
               {loading ? "Đang đăng nhập..." : "Đăng nhập"}
             </button>
           </form>
 
           <div className="relative my-6">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t border-slate-300"></span>
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-white px-2 text-slate-500">Hoặc</span>
             </div>
           </div>
 
           <a
             href="/api/auth/google"
             className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
               <path
                 fill="#EA4335"
                 d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.74-4.01-8.74-8.94s3.9-8.94 8.74-8.94c2.75 0 4.59 1.16 5.65 2.17l2.6-2.6C19.53 1.95 16.05 0 12.48 0 5.58 0 0 5.58 0 12.48s5.58 12.48 12.48 12.48c7.2 0 12.2-5.2 12.2-12.23 0-.83-.08-1.46-.22-2.08H12.48z"
               />
             </svg>
             Tiếp tục với Google
           </a>
 
           <p className="text-center text-slate-600 mt-6">
             Chưa có tài khoản?{" "}
             <Link
               href="/auth/register"
               className="text-blue-600 hover:underline font-medium"
             >
               Đăng ký ngay
             </Link>
           </p>
           <p className="text-center text-slate-600 mt-4">
             <Link
               href="/auth/forgot-password"
               className="text-blue-600 hover:underline font-medium"
             >
               Quên mật khẩu?
             </Link>
           </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">Đang tải...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
