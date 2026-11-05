
import {
    Course,
    Enrollment,
    InstructorProfile,
} from "../models/index.js";

// Lấy courseId từ URL params
const getCourseId = (req) => {
    return req.params.courseId || req.params.id;
};

// Kiểm tra Instructor đã được Admin phê duyệt
export const requireApprovedInstructor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập.",
            });
        }

        // Admin không cần kiểm tra InstructorProfile.
        if (req.user.role === "admin") {
            return next();
        }

        if (req.user.role !== "instructor") {
            return res.status(403).json({
                success: false,
                message: "Chỉ giảng viên mới được thực hiện chức năng này.",
            });
        }

        const profile = await InstructorProfile.findOne({
            user: req.user.id,
            applicationStatus: "approved",
        }).lean();

        if (!profile) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản giảng viên chưa được phê duyệt.",
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi khi kiểm tra trạng thái giảng viên.",
        });
    }
};

// Kiểm tra quyền quản lý một khóa học
// Admin: được quản lý tất cả khóa học
// Instructor: chỉ được quản lý khóa học của mình
export const requireCourseOwner = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập.",
            });
        }

        const courseId = getCourseId(req);

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu courseId.",
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khóa học.",
            });
        }

        // Admin được quản lý mọi khóa học
        if (req.user.role === "admin") {
            req.course = course;
            return next();
        }

        // Chỉ Instructor mới có quyền quản lý khóa học
        if (req.user.role !== "instructor") {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền quản lý khóa học.",
            });
        }

        // Kiểm tra Instructor đã được phê duyệt
        const profile = await InstructorProfile.findOne({
            user: req.user.id,
            applicationStatus: "approved",
        }).lean();

        if (!profile) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản giảng viên chưa được phê duyệt.",
            });
        }

        // Kiểm tra quyền sở hữu khóa học
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền quản lý khóa học này.",
            });
        }

        req.course = course;
        return next();
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "courseId không hợp lệ.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi khi kiểm tra quyền sở hữu khóa học.",
        });
    }
};

// Kiểm tra quyền truy cập nội dung khóa học
// Admin: được truy cập tất cả
// Instructor: chỉ xem nội dung khóa học của mình
// Student: phải có Enrollment active
export const requireCourseContentAccess = async (
    req,
    res,
    next
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập.",
            });
        }

        const courseId = getCourseId(req);

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu courseId.",
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khóa học.",
            });
        }

        // Admin được truy cập tất cả nội dung
        if (req.user.role === "admin") {
            req.course = course;
            return next();
        }

        // Instructor chỉ được xem nội dung khóa học của mình
        if (req.user.role === "instructor") {
            const profile = await InstructorProfile.findOne({
                user: req.user.id,
                applicationStatus: "approved",
            }).lean();

            if (
                !profile ||
                course.instructor.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền truy cập nội dung khóa học này.",
                });
            }

            req.course = course;
            return next();
        }

        // Student phải có Enrollment đang hoạt động
        if (req.user.role === "student") {
            const enrollment = await Enrollment.findOne({
                student: req.user.id,
                course: course._id,
                status: "active",
            }).lean();

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn chưa đăng ký hoặc không còn quyền học khóa học này.",
                });
            }

            req.course = course;
            req.enrollment = enrollment;

            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập nội dung khóa học.",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "courseId không hợp lệ.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi khi kiểm tra quyền truy cập khóa học.",
        });
    }
};
