import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { getAuthToken, setAuthToken } from "../api/client";
import HomePage from "../views/HomePage";
import TopPage from "../views/TopPage";
import SongPage from "../views/SongPage";
import AdminDashboardPage from "../views/AdminDashboardPage";
import AdminArtistsPage from "../views/AdminArtistsPage";
import AdminSongsPage from "../views/AdminSongsPage";
import AdminEditArtistPage from "../views/AdminEditArtistPage";
import AdminEditSongPage from "../views/AdminEditSongPage";
import SignInPage from "../views/SignInPage";

function LinkTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "pill" : "pill muted")}
      style={{ borderColor: "rgba(255,255,255,0.18)" }}
    >
      {label}
    </NavLink>
  );
}

function AuthTab() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());
  const nav = useNavigate();
  const location = useLocation();

  // Re-check auth state when location changes (after sign-in redirect)
  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, [location]);

  function handleLogout() {
    setAuthToken(null);
    setIsLoggedIn(false);
    nav("/");
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className="pill muted"
        style={{ borderColor: "rgba(255,255,255,0.18)", background: "none", border: "1px solid", cursor: "pointer" }}
      >
        Logout
      </button>
    );
  }

  return <LinkTab to="/signin" label="Sign in" />;
}

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <div className="brand-block">
            <div className="brand">RiffRank</div>
            <div className="brand-subtitle">Rank, search, and rate music in one cinematic view.</div>
          </div>
          <nav className="nav app-nav" aria-label="Primary">
            <LinkTab to="/" label="Home" />
            <LinkTab to="/top" label="Top" />
            <AuthTab />
            <LinkTab to="/admin" label="Admin" />
          </nav>
        </div>
      </header>

      <main className="container app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/top" element={<TopPage />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/artists" element={<AdminArtistsPage />} />
          <Route path="/admin/artists/edit" element={<AdminEditArtistPage />} />
          <Route path="/admin/songs" element={<AdminSongsPage />} />
          <Route path="/admin/songs/edit" element={<AdminEditSongPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="container app-footer-inner">
          <div>
            <div className="footer-title">RiffRank</div>
            <div className="muted">Weighted charts, rich search, and detailed song pages.</div>
          </div>
          <div className="footer-meta">
            <span>Top 100</span>
            <span>Search</span>
            <span>Albums</span>
            <span>Artists</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
