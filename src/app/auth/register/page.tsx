"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    acceptTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setValidationErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          const errors: Record<string, string> = {};
          data.details.forEach(
            (detail: { path: string[]; message: string }) => {
              errors[detail.path[0]] = detail.message;
            }
          );
          setValidationErrors(errors);
        } else {
          setError(data.error || "Đăng ký thất bại");
        }
        return;
      }

      router.push("/auth/profile");
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
         <div className="bg-white rounded-xl shadow-lg p-8">
           <div className="flex justify-center mb-6">
             <img src="/logo.png" alt="Vutera Logo" className="h-12 w-auto" />
           </div>
           <h1 className="text-3xl font-bold text-slate-900 mb-2">
             Tham gia Vutera
           </h1>
           <p className="text-slate-600 mb-6">Tạo tài khoản định danh cho Vutera</p>


          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Họ và tên <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputClass} border-slate-300`}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`${inputClass} ${validationErrors.email ? "border-red-500" : "border-slate-300"}`}
                placeholder="email@example.com"
              />
              {validationErrors.email && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`${inputClass} ${validationErrors.password ? "border-red-500" : "border-slate-300"}`}
                placeholder="••••••••"
              />
              {validationErrors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.password}
                </p>
              )}
               <p className="text-xs text-slate-500 mt-2">
                 Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số
               </p>
             </div>
 
             <div className="flex items-start gap-3">
               <input
                 type="checkbox"
                 name="acceptTerms"
                 checked={formData.acceptTerms}
                 onChange={handleChange}
                 className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                 required
               />
               <label className="text-sm text-slate-600 leading-tight">
                 Tôi đồng ý với <Link href="/terms" className="text-blue-600 hover:underline">Điều khoản sử dụng</Link> và <Link href="/privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link>
               </label>
             </div>
 
             <button
               type="submit"
               disabled={loading}

              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Đã có tài khoản?{" "}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
