import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { api, getAuthToken, setAuthToken } from "../api/client";
import HomePage from "../views/HomePage";
import TopPage from "../views/TopPage";
import SongPage from "../views/SongPage";
import AdminDashboardPage from "../views/AdminDashboardPage";
import AdminArtistsPage from "../views/AdminArtistsPage";
import AdminSongsPage from "../views/AdminSongsPage";
import AdminEditArtistPage from "../views/AdminEditArtistPage";
import AdminEditSongPage from "../views/AdminEditSongPage";
import SignInPage from "../views/SignInPage";
import ProfilePage from "../views/ProfilePage";

const PROFILE_STORAGE_KEY = "riffrank_profile";

function getProfileSummary() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? "{}");
    return {
      displayName: typeof profile.displayName === "string" ? profile.displayName : "",
      avatarData: typeof profile.avatarData === "string" ? profile.avatarData : ""
    };
  } catch {
    return { displayName: "", avatarData: "" };
  }
}

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
  const [profile, setProfile] = useState(getProfileSummary);
  const nav = useNavigate();
  const location = useLocation();

  // Re-check auth state when location changes (after sign-in redirect)
  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, [location]);

  useEffect(() => {
    const refreshProfile = () => setProfile(getProfileSummary());
    if (isLoggedIn) {
      api.auth.profile().then((savedProfile) => {
        const nextProfile = {
          displayName: savedProfile.displayName ?? "",
          avatarData: savedProfile.avatarData ?? ""
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
        setProfile(nextProfile);
      }).catch(() => undefined);
    }
    window.addEventListener("storage", refreshProfile);
    window.addEventListener("riffrank-profile-updated", refreshProfile);
    return () => {
      window.removeEventListener("storage", refreshProfile);
      window.removeEventListener("riffrank-profile-updated", refreshProfile);
    };
  }, []);

  function handleLogout() {
    setAuthToken(null);
    setIsLoggedIn(false);
    nav("/");
  }

  if (isLoggedIn) {
    return (
      <span className="auth-actions">
        <NavLink
          to="/profile"
          className={({ isActive }) => `profile-nav-link ${isActive ? "active" : ""}`}
        >
          {profile.avatarData ? (
            <img src={profile.avatarData} alt="" />
          ) : (
            <span className="profile-nav-fallback">{(profile.displayName || "You").slice(0, 2).toUpperCase()}</span>
          )}
          <span>{profile.displayName || "Profile"}</span>
        </NavLink>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </span>
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
            <Link className="brand" to="/" aria-label="RiffRank home">RiffRank</Link>
            <div className="brand-subtitle">Find great songs. See what people are rating.</div>
          </div>
          <nav className="nav app-nav" aria-label="Primary">
            <LinkTab to="/" label="Home" />
            <LinkTab to="/top" label="Top 100" />
            <AuthTab />
          </nav>
        </div>
      </header>

      <main className="container app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/top" element={<TopPage />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
            <div className="muted">Community ratings and the songs worth hearing.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
