import { Router } from "express";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    updateCategoryStatus,
} from "../controllers/category.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Tất cả endpoint Category đều yêu cầu đăng nhập.
router.use(authenticate);

// Danh mục được hiển thị cho học viên, giảng viên và Admin.
router.get("/", authorize("student", "instructor", "admin"), getCategories);
router.get("/:id", authorize("student", "instructor", "admin"), getCategoryById);

// Các thao tác quản trị danh mục chỉ dành cho Admin.
router.post("/", authorize("admin"), createCategory);
router.put("/:id", authorize("admin"), updateCategory);
router.patch("/:id/status", authorize("admin"), updateCategoryStatus);
router.delete("/:id", authorize("admin"), deleteCategory);

export default router;
