// Hero.jsx
import { Link } from "react-router-dom";
import "../styles/hero.css";

export default function Hero() {
  return (
    <section className="hero hero--with-bg" role="region" aria-label="Intro">
      <div className="hero__overlay" /> {/* dark overlay for readability */}
      <div className="hero__inner">
        <div className="hero__content">
          <h1 className="hero__title">
            Tell small <span className="hero__accent">true</span> stories.
          </h1>
          <p className="hero__subtitle">
            A privacy-first travel journal. Capture moments, not metrics.
          </p>
          <div className="hero__cta">
            <Link className="btn primary btn-lg" to="/login">Start a Story</Link>
            <Link className="btn ghost btn-lg" to="/login">Discover</Link>
          </div>
          <p className="hero__meta">
            Your data stays on device in this prototype. No tracking.
          </p>
        </div>
      </div>
    </section>
  );
}
