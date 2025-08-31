import { useEffect, useState } from "react";
import '../styles/auth-hero.css'

export default function AuthLayout({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className={`auth-shell ${scrolled ? "is-scrolled" : ""}`}>
      <div className="auth-hero" aria-hidden="true">
        <div className="auth-hero__overlay" />
        <div className="auth-hero__copy">
          <h1 className="auth-hero__title">
            Tell your <span className="accent">travel</span> stories.
          </h1>
          <p className="auth-hero__subtitle">
            A privacy-first travel journal. Capture moments, not metrics.
          </p>
        </div>
      </div>

      <div className="auth-panel">
        {children}
      </div>
    </section>
  );
}
