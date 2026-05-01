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

const YEARS = Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => (1900 + i).toString());
const MONTHS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));

const COMMON_TIMEZONES = [
  { label: "Hà Nội / Bangkok (GMT+7)", value: "Asia/Ho_Chi_Minh" },
  { label: "Tokyo / Seoul (GMT+9)", value: "Asia/Tokyo" },
  { label: "Beijing / Singapore (GMT+8)", value: "Asia/Shanghai" },
  { label: "New Delhi (GMT+5:30)", value: "Asia/Kolkata" },
  { label: "London (GMT+0)", value: "Europe/London" },
  { label: "Paris / Berlin (GMT+1)", value: "Europe/Paris" },
  { label: "New York (GMT-5)", value: "America/New_York" },
  { label: "Los Angeles (GMT-8)", value: "America/Los_Angeles" },
  { label: "UTC (GMT+0)", value: "UTC" },
];


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
        
        const profile = data.user.profile;
        setFormData({
          fullName: data.user.name || profile?.fullName || "",
          gender: profile?.gender || "",
          birthDate: profile?.birthDate?.split("T")[0] || "",
          birthTime: profile?.birthTime || "",
          birthTimezone: profile?.birthTimezone || "Asia/Ho_Chi_Minh",
          birthLocation: profile?.birthLocation || "",
        });
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

  const handleDeleteAccount = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.")) {
      return;
    }

    setGlobalError("");
    setSaveLoading(true);
    try {
      const response = await fetch("/api/auth/account/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setGlobalError(data.error || "Không thể xóa tài khoản");
        return;
      }

      alert("Tài khoản đã được xóa.");
      router.push("/auth/login");
    } catch (err) {
      setGlobalError("Đã xảy ra lỗi khi xóa tài khoản");
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
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
           <div className="flex items-center gap-3">
             <img src="/logo.png" alt="Vutera Logo" className="h-8 w-auto" />
             <h1 className="text-2xl font-bold text-slate-900">Vutera Account</h1>
           </div>
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
                     Ngày sinh (Dương lịch)
                   </label>
                   <div className="grid grid-cols-3 gap-2">
                     {(() => {
                       const [y, m, d] = formData.birthDate ? formData.birthDate.split("-") : ["", "", ""];
                       return (
                         <>
                           <select
                             value={d}
                             onChange={(e) => setFormData({ ...formData, birthDate: `${y}-${m}-${e.target.value}` })}
                             className={fieldErrors.birthDate ? inputError : inputNormal}
                           >
                             <option value="">Ngày</option>
                             {DAYS.map((day) => (
                               <option key={day} value={day}>{parseInt(day)}</option>
                             ))}
                           </select>
                           <select
                             value={m}
                             onChange={(e) => setFormData({ ...formData, birthDate: `${y}-${e.target.value}-${d}` })}
                             className={fieldErrors.birthDate ? inputError : inputNormal}
                           >
                             <option value="">Tháng</option>
                             {MONTHS.map((month, idx) => (
                               <option key={month} value={month}>{idx + 1}</option>
                             ))}
                           </select>
                           <select
                             value={y}
                             onChange={(e) => setFormData({ ...formData, birthDate: `${e.target.value}-${m}-${d}` })}
                             className={fieldErrors.birthDate ? inputError : inputNormal}
                           >
                             <option value="">Năm</option>
                             {YEARS.map((year) => (
                               <option key={year} value={year}>{year}</option>
                             ))}
                           </select>
                         </>
                       );
                     })()}
                   </div>
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
                  <select
                    value={formData.birthTimezone}
                    onChange={(e) => setFormData({ ...formData, birthTimezone: e.target.value })}
                    className={fieldErrors.birthTimezone ? inputError : inputNormal}
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
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
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
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

         {/* Vùng nguy hiểm */}
         <div className="bg-red-50 border border-red-200 rounded-lg p-6">
           <h3 className="font-bold text-red-900 mb-2">Vùng nguy hiểm</h3>
           <p className="text-red-800 text-sm mb-4">
             Xóa tài khoản sẽ xóa vĩnh viễn toàn bộ dữ liệu cá nhân và hồ sơ sinh của bạn. 
             Hành động này không thể hoàn tác.
           </p>
           <button
             onClick={handleDeleteAccount}
             disabled={saveLoading}
             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition"
           >
             {saveLoading ? "Đang xử lý..." : "Xóa tài khoản của tôi"}
           </button>
         </div>

      </div>
    </div>
  );
}
