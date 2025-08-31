import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useStories } from "./store/stories.js";

// Layout
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public (auth) pages
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

// Private pages
import HomePage from "./pages/HomePage.jsx";
import CreateStoryPage from "./pages/CreateStoryPage.jsx";
import TimelinePage from "./pages/TimelinePage.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import BookmarksPage from "./pages/BookmarksPage.jsx";
import StoryPage from "./pages/StoryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  const { prefs } = useStories();
  const location = useLocation();

  // Detect if it's on an auth page
  const onAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    const root = document.documentElement;
    let mql;

    function apply(theme) {
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", isDark ? "dark" : "light");
      } else {
        root.setAttribute("data-theme", theme);
      }
    }

    apply(prefs.theme);

    if (prefs.theme === "system" && window.matchMedia) {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("system");
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [prefs.theme]);

  return (
    <>
      {/* Show header only after login */}
      {!onAuthPage && <Header />}
      {/* Show hero only on login/signup */}
      {onAuthPage && <Hero />}

      <main className="container">
        <Routes>
          {/* First page = Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Private routes (only accessible if logged in) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/create" element={<CreateStoryPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/story/:id" element={<StoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all → Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>

      {/* Footer only for logged-in users */}
      {!onAuthPage && (
        <footer className="container meta" style={{ paddingBottom: "2rem" }}>
          Prototype for dissertation evaluation — no tracking, no server required.
        </footer>
      )}
    </>
  );
}
