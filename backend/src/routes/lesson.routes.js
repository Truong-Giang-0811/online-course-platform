import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { requireCourseOwner } from "../middlewares/course-access.middleware.js";
import {
  listLessons, getLessonById, createLesson, updateLesson, deleteLesson, reorderLessons,
} from "../controllers/lesson.controller.js";

// Kế thừa courseId và sectionId từ các router cha.
const router = Router({ mergeParams: true });
router.use(authenticate, authorize("instructor", "admin"), requireCourseOwner);

router.get("/", listLessons);
router.post("/", createLesson);
router.put("/reorder", reorderLessons);
router.get("/:lessonId", getLessonById);
router.put("/:lessonId", updateLesson);
router.delete("/:lessonId", deleteLesson);

export default router;
