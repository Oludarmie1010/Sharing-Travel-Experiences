// src/components/AppHeader.jsx
import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.js";   // ✅ import your auth store
import "../styles/header.css";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const { logout } = useAuth();              // ✅ get logout from auth
  const navigate = useNavigate();

  // Add shadow/background after scrolling a bit
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  function handleLogout() {
    logout();              
    navigate("/login");    
  }

  return (
    <header className={`site-header ${elevated ? "is-elevated" : ""}`}>
      <div className="site-header__inner">
        <Link to="/home" className="brand">
          <span className="brand__title">Travel Stories</span>
        </Link>

        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open ? "true" : "false"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle__bar" />
          <span className="nav-toggle__bar" />
          <span className="nav-toggle__bar" />
        </button>

        <nav
          className={`primary-nav ${open ? "open" : ""}`}
          role="navigation"
          aria-label="Primary"
          onClick={() => setOpen(false)} // tap a link closes the menu
        >
          <NavLink to="/home" end>Home</NavLink>
          <NavLink to="/create">Create</NavLink>
          <NavLink to="/timeline">Timeline</NavLink>
          <NavLink to="/discover">Discover</NavLink>
          <NavLink to="/bookmarks">Bookmarks</NavLink>
          <NavLink to="/settings">Settings</NavLink>

          {/* ✅ Logout link/button */}
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            style={{ marginLeft: "1rem" }}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
