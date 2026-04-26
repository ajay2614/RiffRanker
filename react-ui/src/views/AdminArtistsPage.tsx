import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ADMIN_KEY_STORAGE } from "./AdminDashboardPage";

export default function AdminArtistsPage() {
  const [adminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) ?? "dev-admin-key");

  const [createName, setCreateName] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [createBiography, setCreateBiography] = useState("");
  const [createSpotifyUrl, setCreateSpotifyUrl] = useState("");
  const [createWebsiteUrl, setCreateWebsiteUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canCreate = useMemo(() => createName.trim().length > 0, [createName]);

  async function createArtist(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const created = await api.artists.create(adminKey, {
        name: createName.trim(),
        imageUrl: createImageUrl.trim() || null,
        biography: createBiography.trim() || null,
        spotifyUrl: createSpotifyUrl.trim() || null,
        websiteUrl: createWebsiteUrl.trim() || null
      });
      setMessage(`Created artist: ${created.name} (${created.id})`);
      setCreateName("");
      setCreateImageUrl("");
      setCreateBiography("");
      setCreateSpotifyUrl("");
      setCreateWebsiteUrl("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Create artist</h2>
          <div className="muted">Add biography + links for a richer artist page later.</div>
        </div>
        <Link className="pill" to="/admin">
          ← Admin
        </Link>
      </div>

      <form onSubmit={createArtist} style={{ marginTop: 12 }}>
        <div className="row">
          <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Artist name" />
          <input
            value={createImageUrl}
            onChange={(e) => setCreateImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <textarea
            value={createBiography}
            onChange={(e) => setCreateBiography(e.target.value)}
            placeholder="Biography (optional)"
            style={{
              width: "100%",
              minHeight: 140,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              resize: "vertical"
            }}
          />
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input
            value={createSpotifyUrl}
            onChange={(e) => setCreateSpotifyUrl(e.target.value)}
            placeholder="Spotify artist URL (optional)"
          />
          <input
            value={createWebsiteUrl}
            onChange={(e) => setCreateWebsiteUrl(e.target.value)}
            placeholder="Website URL (optional)"
          />
        </div>

        <div style={{ marginTop: 10 }} className="row">
          <button className="primary" disabled={busy || !canCreate} type="submit">
            {busy ? "Working…" : "Create artist"}
          </button>
          <Link className="pill" to="/admin/artists/edit">
            Edit artist
          </Link>
          <Link className="pill" to="/admin/songs">
            Create song →
          </Link>
        </div>
      </form>

      {message ? <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{message}</div> : null}
    </div>
  );
}
