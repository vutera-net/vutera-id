import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        {/* Logo/Branding */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Harmony AI</h1>
          <p className="text-slate-300">Trung tâm Định danh & Xác thực</p>
          <div className="h-1 w-16 bg-blue-500 mx-auto mt-4"></div>
        </div>

        {/* Auth Options */}
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Bắt đầu ngay
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Quản lý tài khoản Harmony AI của bạn
            </p>
          </div>

          <Link
            href="/auth/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-center"
          >
            Đăng nhập
          </Link>

          <Link
            href="/auth/register"
            className="block w-full border-2 border-blue-600 hover:border-blue-700 text-blue-600 hover:text-blue-700 font-semibold py-3 rounded-lg transition text-center"
          >
            Tạo tài khoản
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🔐</div>
            <p className="text-slate-300 text-sm font-medium">Bảo mật cao</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌐</div>
            <p className="text-slate-300 text-sm font-medium">
              Đăng nhập một lần
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">👤</div>
            <p className="text-slate-300 text-sm font-medium">
              Quản lý hồ sơ
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-slate-300 text-sm font-medium">Dữ liệu sinh nhật</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-xs">
          <p>Một phần của hệ sinh thái Harmony AI</p>
          <p className="mt-2">
            <span className="text-slate-500">Dịch vụ khác:</span>{" "}
            <span className="text-slate-400">
              tuvi.vutera.net • menhan.vutera.net
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
