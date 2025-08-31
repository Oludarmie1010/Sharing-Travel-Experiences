import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.js";
import { useStories } from "../store/stories.js";
import "../styles/auth.css";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, setDisplayName } = useAuth();
  const { setPrefs } = useStories();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agree: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e) {
    e.preventDefault();

    // basic demo validation
    if (!form.name || !form.email || !form.password || !form.agree) {
      setErr("Please fill all fields and accept the terms.");
      return;
    }
    if (form.password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setErr("");

    // create account + sync profile across stores
    signup({ name: form.name, email: form.email, remember: true });
    setDisplayName(form.name);
    setPrefs({ displayName: form.name });

    // redirect after signup
    navigate("/timeline"); // change to "/home" if that’s your landing page
  }

  return (
    <AuthLayout>
    <section className="auth">
      <div className="auth__container">
        <div className="auth__card" role="form" aria-labelledby="signup-title">
          <h1 id="signup-title" className="auth__title">Create your account</h1>
          <p className="auth__subtitle">Start capturing small, true stories.</p>

          {err && <div className="auth__alert" role="alert">{err}</div>}

          <form onSubmit={submit} className="auth__form" noValidate>
            <label className="auth__field">
              <span className="auth__label">Display name</span>
              <input
                type="text"
                className="auth__input"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ada"
                required
              />
            </label>

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
                  placeholder="At least 8 characters"
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

            <label className="auth__check" style={{ marginTop: ".25rem" }}>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => update("agree", e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <Link to="#" className="auth__link">Terms</Link> and{" "}
                <Link to="#" className="auth__link">Privacy</Link>.
              </span>
            </label>

            <button className="btn primary btn-lg auth__submit" type="submit">
              Create account
            </button>
          </form>

          <p className="auth__switch">
            Already have an account?{" "}
            <Link to="/login" className="auth__link">Log in</Link>
          </p>
        </div>
      </div>
    </section>
    </AuthLayout>
  );
}
