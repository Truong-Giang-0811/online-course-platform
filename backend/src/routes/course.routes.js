
import { Router } from "express";
import sectionRoutes from "./section.routes.js";

import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getMyCourses,
  publishCourse,
  unpublishCourse,
} from "../controllers/course.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

import {
  requireApprovedInstructor,
  requireCourseOwner,
} from "../middlewares/course-access.middleware.js";

const router = Router();

// Quản lý chương thuộc một khóa học.
router.use("/:courseId/sections", sectionRoutes);

// CREATE COURSE
router.post(
  "/",
  authenticate,
  authorize("instructor", "admin"),
  requireApprovedInstructor,
  createCourse
);

// GET MY COURSES - phải đặt trước /:id để tránh bị hiểu "mine" là courseId.
router.get(
  "/mine",
  authenticate,
  authorize("instructor"),
  getMyCourses
);

// GET COURSE LIST
router.get(
  "/",
  authenticate,
  authorize("student", "instructor", "admin"),
  getCourses
);

// PUBLISH COURSE
router.patch(
  "/:id/publish",
  authenticate,
  authorize("instructor", "admin"),
  requireCourseOwner,
  publishCourse
);

// UNPUBLISH COURSE
router.patch(
  "/:id/unpublish",
  authenticate,
  authorize("instructor", "admin"),
  requireCourseOwner,
  unpublishCourse
);

// GET COURSE DETAIL
router.get(
  "/:id",
  authenticate,
  authorize("student", "instructor", "admin"),
  getCourseById
);

// UPDATE COURSE
router.put(
  "/:id",
  authenticate,
  authorize("instructor", "admin"),
  requireCourseOwner,
  updateCourse
);

// DELETE COURSE
router.delete(
  "/:id",
  authenticate,
  authorize("instructor", "admin"),
  requireCourseOwner,
  deleteCourse
);

export default router;
