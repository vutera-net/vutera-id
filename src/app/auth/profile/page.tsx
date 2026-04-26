"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  profile: {
    fullName?: string;
    gender?: string;
    birthDate?: string;
    birthTime?: string;
    birthTimezone?: string;
    birthLocation?: string;
  } | null;
  subscription: {
    plan: string;
    status: string;
  } | null;
}

type FormErrors = Record<string, string>;

// Bảng dịch lỗi validation từ API sang tiếng Việt thân thiện
const FIELD_ERROR_VI: Record<string, string> = {
  fullName: "Họ tên tối thiểu 2 ký tự",
  gender: "Vui lòng chọn giới tính",
  birthDate: "Ngày sinh không hợp lệ",
  birthTime: "Giờ sinh không hợp lệ (HH:mm)",
  birthTimezone: "Múi giờ không hợp lệ",
  birthLocation: "Nơi sinh không hợp lệ",
};

// Hiển thị ngày theo định dạng DD/MM/YYYY thân thiện với người Việt
function formatDateVI(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

const inputBase =
  "w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";
const inputNormal = `${inputBase} border-slate-300`;
const inputError = `${inputBase} border-red-500 focus:ring-red-400`;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-600 text-xs mt-1">{msg}</p>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    birthTime: "",
    birthTimezone: "Asia/Ho_Chi_Minh",
    birthLocation: "",
  });

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/auth/login");
        return;
      }
      const data = await response.json();
      setUser(data.user);
      if (data.user.profile) {
        setFormData({
          fullName: data.user.profile.fullName || "",
          gender: data.user.profile.gender || "",
          birthDate: data.user.profile.birthDate?.split("T")[0] || "",
          birthTime: data.user.profile.birthTime || "",
          birthTimezone: data.user.profile.birthTimezone || "Asia/Ho_Chi_Minh",
          birthLocation: data.user.profile.birthLocation || "",
        });
      }
    } catch (err) {
      setGlobalError("Không thể tải thông tin hồ sơ");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  // Client-side validation trước khi gọi API
  const validate = (): FormErrors => {
    const errors: FormErrors = {};
    if (formData.fullName && formData.fullName.length < 2) {
      errors.fullName = "Họ tên tối thiểu 2 ký tự";
    }
    if (formData.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birthDate)) {
      errors.birthDate = "Ngày sinh không hợp lệ";
    }
    if (formData.birthTime && !/^\d{2}:\d{2}$/.test(formData.birthTime)) {
      errors.birthTime = "Giờ sinh phải theo định dạng HH:mm";
    }
    return errors;
  };

  const handleSaveProfile = async () => {
    setGlobalError("");
    setFieldErrors({});

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse lỗi từng field từ API
        if (data.details && Array.isArray(data.details)) {
          const errors: FormErrors = {};
          data.details.forEach((d: { path: string[]; message: string }) => {
            const field = d.path[0];
            if (field) {
              // Ưu tiên message tiếng Việt đã định nghĩa, fallback về message từ server
              errors[field] = FIELD_ERROR_VI[field] ?? d.message;
            }
          });
          setFieldErrors(errors);
          if (Object.keys(errors).length === 0) {
            setGlobalError(data.error || "Không thể lưu hồ sơ");
          }
        } else {
          setGlobalError(data.error || "Không thể lưu hồ sơ");
        }
        return;
      }

      setEditing(false);
      fetchUserData();
    } catch (err) {
      setGlobalError("Đã xảy ra lỗi khi lưu");
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFieldErrors({});
    setGlobalError("");
  };

  const planLabel: Record<string, string> = {
    FREE: "Miễn phí",
    AN_NHIEN: "An Nhiên",
    BINH_AN: "Bình An",
  };

  const genderLabel: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">Không tìm thấy người dùng</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Harmony AI — Tài khoản</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {globalError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
            {globalError}
          </div>
        )}

        {/* Thông tin tài khoản */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin tài khoản</h2>
          <div className="space-y-2 text-slate-700">
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium">Tên hiển thị:</span>{" "}
              {user.name || <span className="text-slate-400">Chưa cập nhật</span>}
            </p>
            {user.subscription && (
              <p>
                <span className="font-medium">Gói dịch vụ:</span>{" "}
                {planLabel[user.subscription.plan] || user.subscription.plan}
              </p>
            )}
          </div>
        </div>

        {/* Thông tin sinh */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Thông tin sinh</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Chỉnh sửa
              </button>
            )}
          </div>

          {editing ? (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Họ và tên */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={fieldErrors.fullName ? inputError : inputNormal}
                  placeholder="Nhập họ và tên"
                />
                <FieldError msg={fieldErrors.fullName} />
              </div>

              {/* Giới tính + Ngày sinh */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={fieldErrors.gender ? inputError : inputNormal}
                  >
                    <option value="">Chọn</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                  <FieldError msg={fieldErrors.gender} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className={fieldErrors.birthDate ? inputError : inputNormal}
                  />
                  <FieldError msg={fieldErrors.birthDate} />
                </div>
              </div>

              {/* Giờ sinh + Múi giờ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giờ sinh
                  </label>
                  <input
                    type="time"
                    value={formData.birthTime}
                    onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                    className={fieldErrors.birthTime ? inputError : inputNormal}
                  />
                  <FieldError msg={fieldErrors.birthTime} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Múi giờ
                  </label>
                  <input
                    type="text"
                    value={formData.birthTimezone}
                    onChange={(e) => setFormData({ ...formData, birthTimezone: e.target.value })}
                    className={fieldErrors.birthTimezone ? inputError : inputNormal}
                    placeholder="Asia/Ho_Chi_Minh"
                  />
                  <FieldError msg={fieldErrors.birthTimezone} />
                </div>
              </div>

              {/* Nơi sinh */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nơi sinh
                </label>
                <input
                  type="text"
                  value={formData.birthLocation}
                  onChange={(e) => setFormData({ ...formData, birthLocation: e.target.value })}
                  className={fieldErrors.birthLocation ? inputError : inputNormal}
                  placeholder="Tỉnh/Thành phố"
                />
                <FieldError msg={fieldErrors.birthLocation} />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saveLoading ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Họ và tên:</span>{" "}
                {formData.fullName || <span className="text-slate-400">Chưa cập nhật</span>}
              </p>
              <p>
                <span className="font-medium text-slate-700">Giới tính:</span>{" "}
                {genderLabel[formData.gender] || <span className="text-slate-400">Chưa cập nhật</span>}
              </p>
              <p>
                <span className="font-medium text-slate-700">Ngày sinh:</span>{" "}
                {formData.birthDate
                  ? formatDateVI(formData.birthDate)
                  : <span className="text-slate-400">Chưa cập nhật</span>}
              </p>
              <p>
                <span className="font-medium text-slate-700">Giờ sinh:</span>{" "}
                {formData.birthTime || <span className="text-slate-400">Chưa cập nhật</span>}
              </p>
              <p>
                <span className="font-medium text-slate-700">Múi giờ:</span>{" "}
                {formData.birthTimezone}
              </p>
              <p>
                <span className="font-medium text-slate-700">Nơi sinh:</span>{" "}
                {formData.birthLocation || <span className="text-slate-400">Chưa cập nhật</span>}
              </p>
            </div>
          )}
        </div>

        {/* Bước tiếp theo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">Bước tiếp theo</h3>
          <p className="text-blue-800 text-sm mb-3">
            Hồ sơ của bạn đã sẵn sàng. Bây giờ bạn có thể:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Dùng tài khoản này để đăng nhập vào các ứng dụng khác</li>
            <li>• Truy cập phân tích Master AI tại menhan.vutera.net</li>
            <li>• Theo dõi vận mệnh trong Nhật ký số phận</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
