import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.js";
import "../styles/auth.css";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e) {
    e.preventDefault();

    if (!form.email || !form.password) {
      setErr("Please enter your email and password.");
      return;
    }

    setErr("");

    login({ email: form.email, remember: form.remember });

    navigate("/timeline"); 
  }

  return (
    <AuthLayout>
    <section className="auth">
      <div className="auth__container">
        <div className="auth__card" role="form" aria-labelledby="login-title">
          <h1 id="login-title" className="auth__title">Welcome back</h1>
          <p className="auth__subtitle">Log in to continue your travel journal.</p>

          {err && <div className="auth__alert" role="alert">{err}</div>}

          <form onSubmit={submit} className="auth__form" noValidate>
            <label className="auth__field">
              <span className="auth__label">Email</span>
              <input
                type="email"
                className="auth__input"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="auth__field">
              <span className="auth__label">Password</span>
              <div className="auth__password">
                <input
                  type={showPw ? "text" : "password"}
                  className="auth__input"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="auth__pwbtn"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <div className="auth__row">
              <label className="auth__check">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => update("remember", e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="#" className="auth__link">Forgot password?</Link>
            </div>

            <button className="btn primary btn-lg auth__submit" type="submit">
              Log in
            </button>
          </form>

          <p className="auth__switch">
            New here? <Link to="/signup" className="auth__link">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
    </AuthLayout>
  );
}
