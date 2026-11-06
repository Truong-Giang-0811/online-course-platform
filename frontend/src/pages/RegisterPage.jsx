import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import Alert from "../components/Alert";
import { useAuth } from "../context/auth-context";
import { validateRegister } from "../utils/validation";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/courses" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateRegister(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await register(form.fullName.trim(), form.email.trim(), form.password);
      navigate("/courses", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng ký thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Tạo tài khoản</h1>
        <Alert>{error}</Alert>
        <label>
          Họ tên
          <input value={form.fullName} autoComplete="name" onChange={update("fullName")} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} autoComplete="email" onChange={update("email")} />
        </label>
        <label>
          Mật khẩu
          <input type="password" value={form.password} autoComplete="new-password" onChange={update("password")} />
        </label>
        <label>
          Xác nhận mật khẩu
          <input
            type="password"
            value={form.confirmPassword}
            autoComplete="new-password"
            onChange={update("confirmPassword")}
          />
        </label>
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Đang tạo..." : "Đăng ký"}
        </button>
        <p className="muted center">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
