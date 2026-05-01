import { z } from "zod";

export const RegisterSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .min(1, "Email là bắt buộc"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Mật khẩu phải có chữ hoa, chữ thường và số"
    ),
  name: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(2, "Họ tên tối thiểu 2 ký tự").optional()
  ),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Bạn cần đồng ý với Điều khoản sử dụng" }),
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .min(1, "Email là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Helper: biến empty string thành undefined để các optional field không bị lỗi validation
const optionalString = (schema: z.ZodString) =>
  z.preprocess((val) => (val === "" ? undefined : val), schema.optional());

export const ProfileSchema = z.object({
  fullName: optionalString(z.string().min(2, "Họ tên tối thiểu 2 ký tự")),
  gender: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["MALE", "FEMALE"], {
      errorMap: () => ({ message: "Vui lòng chọn giới tính" }),
    }).optional()
  ),
  // input type="date" gửi YYYY-MM-DD, không phải ISO datetime đầy đủ
  birthDate: optionalString(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ (YYYY-MM-DD)")
  ),
  birthTime: optionalString(
    z.string().regex(/^\d{2}:\d{2}$/, "Giờ sinh không hợp lệ (HH:mm)")
  ),
  birthTimezone: optionalString(z.string().min(1)),
  birthLocation: optionalString(z.string().min(1)),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
