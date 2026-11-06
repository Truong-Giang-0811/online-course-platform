import { User, InstructorProfile } from "../models/index.js";
import { hashPassword } from "../utils/password.js";

// Tài khoản mặc định lấy từ biến môi trường để không lưu mật khẩu trong mã nguồn.
const getSeedAccounts = () => [
  {
    role: "admin",
    fullName: process.env.SEED_ADMIN_NAME || "Quản trị viên",
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  },
  {
    role: "instructor",
    fullName: process.env.SEED_INSTRUCTOR_NAME || "Giảng viên",
    email: process.env.SEED_INSTRUCTOR_EMAIL,
    password: process.env.SEED_INSTRUCTOR_PASSWORD,
  },
];

// Giảng viên phải có hồ sơ đã được duyệt mới tạo/quản lý được khóa học.
const ensureApprovedInstructorProfile = async (user, reviewer) => {
  await InstructorProfile.updateOne(
    { user: user._id },
    {
      $set: {
        applicationStatus: "approved",
        reviewedBy: reviewer?._id ?? null,
        reviewedAt: new Date(),
      },
      $setOnInsert: { user: user._id },
    },
    { upsert: true }
  );
};

const seedAccount = async ({ role, fullName, email, password }) => {
  if (!email || !password) {
    console.log(`[Seed] Bỏ qua tài khoản ${role}: thiếu email hoặc mật khẩu trong .env.`);
    return null;
  }
  if (password.length < 8 || password.length > 72) {
    console.log(`[Seed] Bỏ qua tài khoản ${role}: mật khẩu phải có từ 8 đến 72 ký tự.`);
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  // Tài khoản đã tồn tại: chỉ đảm bảo đúng role và đang hoạt động, không ghi đè mật khẩu.
  if (existing) {
    if (existing.role !== role || existing.status !== "active") {
      existing.role = role;
      existing.status = "active";
      await existing.save();
      console.log(`[Seed] Đã cập nhật ${normalizedEmail} thành ${role}.`);
    } else {
      console.log(`[Seed] Tài khoản ${role} đã tồn tại: ${normalizedEmail}`);
    }
    return existing;
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role,
  });
  console.log(`[Seed] Đã tạo tài khoản ${role}: ${normalizedEmail}`);
  return user;
};

export const seedDefaultAccounts = async () => {
  const [adminAccount, instructorAccount] = getSeedAccounts();

  const admin = await seedAccount(adminAccount);
  const instructor = await seedAccount(instructorAccount);

  if (instructor) {
    await ensureApprovedInstructorProfile(instructor, admin);
  }
};
