import api from "./client";

// Backend trả về { success, message, data, pagination? } — các hàm dưới đây trả về body đó.
const body = (promise) => promise.then((res) => res.data);

export const authApi = {
  register: (payload) => body(api.post("/auth/register", payload)),
  login: (payload) => body(api.post("/auth/login", payload)),
  logout: (refreshToken) => body(api.post("/auth/logout", { refreshToken })),
  logoutAll: () => body(api.post("/auth/logout-all")),
  me: () => body(api.get("/auth/me")),
};

export const categoryApi = {
  list: (params) => body(api.get("/categories", { params })),
  get: (id) => body(api.get(`/categories/${id}`)),
  create: (payload) => body(api.post("/categories", payload)),
  update: (id, payload) => body(api.put(`/categories/${id}`, payload)),
  setStatus: (id, isActive) => body(api.patch(`/categories/${id}/status`, { isActive })),
  remove: (id) => body(api.delete(`/categories/${id}`)),
};

export const courseApi = {
  list: (params) => body(api.get("/courses", { params })),
  mine: (params) => body(api.get("/courses/mine", { params })),
  get: (id) => body(api.get(`/courses/${id}`)),
  create: (payload) => body(api.post("/courses", payload)),
  update: (id, payload) => body(api.put(`/courses/${id}`, payload)),
  remove: (id) => body(api.delete(`/courses/${id}`)),
  publish: (id) => body(api.patch(`/courses/${id}/publish`)),
  unpublish: (id) => body(api.patch(`/courses/${id}/unpublish`)),
};

export const sectionApi = {
  list: (courseId) => body(api.get(`/courses/${courseId}/sections`)),
  create: (courseId, payload) => body(api.post(`/courses/${courseId}/sections`, payload)),
  update: (courseId, sectionId, payload) =>
    body(api.put(`/courses/${courseId}/sections/${sectionId}`, payload)),
  remove: (courseId, sectionId) => body(api.delete(`/courses/${courseId}/sections/${sectionId}`)),
  reorder: (courseId, sectionIds) =>
    body(api.put(`/courses/${courseId}/sections/reorder`, { sectionIds })),
};

const lessonsPath = (courseId, sectionId) => `/courses/${courseId}/sections/${sectionId}/lessons`;

export const lessonApi = {
  list: (courseId, sectionId) => body(api.get(lessonsPath(courseId, sectionId))),
  get: (courseId, sectionId, lessonId) =>
    body(api.get(`${lessonsPath(courseId, sectionId)}/${lessonId}`)),
  create: (courseId, sectionId, payload) => body(api.post(lessonsPath(courseId, sectionId), payload)),
  update: (courseId, sectionId, lessonId, payload) =>
    body(api.put(`${lessonsPath(courseId, sectionId)}/${lessonId}`, payload)),
  remove: (courseId, sectionId, lessonId) =>
    body(api.delete(`${lessonsPath(courseId, sectionId)}/${lessonId}`)),
  reorder: (courseId, sectionId, lessonIds) =>
    body(api.put(`${lessonsPath(courseId, sectionId)}/reorder`, { lessonIds })),
};
