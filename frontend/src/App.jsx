import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./context/AuthProvider";
import CategoriesPage from "./pages/CategoriesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseFormPage from "./pages/CourseFormPage";
import CoursesPage from "./pages/CoursesPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["instructor", "admin"]} />}>
          <Route path="/courses/new" element={<CourseFormPage />} />
          <Route path="/courses/:id/edit" element={<CourseFormPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["instructor"]} />}>
          <Route path="/my-courses" element={<CoursesPage mine />} />
        </Route>

        <Route path="*" element={<p className="muted center">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
