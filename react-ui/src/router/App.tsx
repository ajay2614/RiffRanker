import { NavLink, Route, Routes } from "react-router-dom";
import HomePage from "../views/HomePage";
import TopPage from "../views/TopPage";
import SongPage from "../views/SongPage";
import AdminDashboardPage from "../views/AdminDashboardPage";
import AdminArtistsPage from "../views/AdminArtistsPage";
import AdminSongsPage from "../views/AdminSongsPage";
import AdminEditArtistPage from "../views/AdminEditArtistPage";
import AdminEditSongPage from "../views/AdminEditSongPage";

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

export default function App() {
  return (
    <div className="container">
      <div className="nav">
        <div className="brand">RiffRank</div>
        <LinkTab to="/" label="Home" />
        <LinkTab to="/top/ROCK" label="Top" />
        <LinkTab to="/admin" label="Admin" />
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/top/:genre" element={<TopPage />} />
        <Route path="/song/:id" element={<SongPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/artists" element={<AdminArtistsPage />} />
        <Route path="/admin/artists/edit" element={<AdminEditArtistPage />} />
        <Route path="/admin/songs" element={<AdminSongsPage />} />
        <Route path="/admin/songs/edit" element={<AdminEditSongPage />} />
      </Routes>
    </div>
  );
}
