import { Router } from "express";
import lessonRoutes from "./lesson.routes.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { requireCourseOwner } from "../middlewares/course-access.middleware.js";
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from "../controllers/section.controller.js";

// mergeParams để truy cập :courseId từ route cha /api/courses/:courseId/sections.
const router = Router({ mergeParams: true });
router.use(authenticate, authorize("instructor", "admin"), requireCourseOwner);

// Các API bài học bên trong một chương.
router.use("/:sectionId/lessons", lessonRoutes);

router.get("/", listSections);
router.post("/", createSection);
router.put("/reorder", reorderSections);
router.put("/:sectionId", updateSection);
router.delete("/:sectionId", deleteSection);

export default router;
