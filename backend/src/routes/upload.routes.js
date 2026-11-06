import { Router } from "express";
import { uploadImage, uploadResource } from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { requireApprovedInstructor } from "../middlewares/course-access.middleware.js";
import {
  uploadImage as parseImage,
  uploadResource as parseResource,
} from "../middlewares/upload.middleware.js";

const router = Router();

// Chỉ giảng viên đã duyệt và Admin được upload nội dung khóa học.
router.use(authenticate, authorize("instructor", "admin"), requireApprovedInstructor);

// multipart/form-data với field "file".
router.post("/image", parseImage, uploadImage);
router.post("/file", parseResource, uploadResource);

export default router;
