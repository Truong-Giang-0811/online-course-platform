import { Router } from "express";
import {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  updateTagStatus,
} from "../controllers/tag.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);

// Các vai trò được phép xem Tag đang hoạt động để sử dụng khi tạo Course.
router.get("/", authorize("student", "instructor", "admin"), getTags);
router.get("/:id", authorize("student", "instructor", "admin"), getTagById);

// Chỉ Admin được quản trị danh mục Tag.
router.post("/", authorize("admin"), createTag);
router.put("/:id", authorize("admin"), updateTag);
router.patch("/:id/status", authorize("admin"), updateTagStatus);
router.delete("/:id", authorize("admin"), deleteTag);

export default router;
