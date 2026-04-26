import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ArtistDto } from "../api/types";
import { ADMIN_KEY_STORAGE } from "./AdminDashboardPage";

type PatchArtist = {
  name?: string;
  imageUrl?: string | null;
  biography?: string | null;
  spotifyUrl?: string | null;
  websiteUrl?: string | null;
};

export default function AdminEditArtistPage() {
  const [adminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) ?? "dev-admin-key");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistDto[]>([]);
  const [selected, setSelected] = useState<ArtistDto | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [biography, setBiography] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.artists.search(q);
      setResults(res);
      if (res.length === 0) setMessage("No artists found.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function pick(a: ArtistDto) {
    setSelected(a);
    setName(a.name ?? "");
    setImageUrl(a.imageUrl ?? "");
    setBiography(a.biography ?? "");
    setSpotifyUrl(a.spotifyUrl ?? "");
    setWebsiteUrl(a.websiteUrl ?? "");
    setMessage(`Selected artist: ${a.name}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const patch: PatchArtist = {};

    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== selected.name) patch.name = trimmedName;

    const nextImageUrl = imageUrl.trim() || null;
    if ((selected.imageUrl ?? null) !== nextImageUrl) patch.imageUrl = nextImageUrl;

    const nextBio = biography.trim() || null;
    if ((selected.biography ?? null) !== nextBio) patch.biography = nextBio;

    const nextSpotifyUrl = spotifyUrl.trim() || null;
    if ((selected.spotifyUrl ?? null) !== nextSpotifyUrl) patch.spotifyUrl = nextSpotifyUrl;

    const nextWebsiteUrl = websiteUrl.trim() || null;
    if ((selected.websiteUrl ?? null) !== nextWebsiteUrl) patch.websiteUrl = nextWebsiteUrl;

    if (Object.keys(patch).length === 0) {
      setMessage("No changes to update.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const updated = await api.artists.update(adminKey, selected.id, patch);
      setSelected(updated);
      setMessage(`Updated artist: ${updated.name}`);
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
          <h2 style={{ margin: 0 }}>Edit artist</h2>
          <div className="muted">Search by name, select, then PATCH only changed fields.</div>
        </div>
        <Link className="pill" to="/admin">
          ← Admin
        </Link>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artist name…" />
        <button type="button" onClick={search} disabled={!canSearch || busy}>
          {busy ? "Working…" : "Search"}
        </button>
      </div>

      {results.length > 0 ? (
        <div className="row" style={{ marginTop: 10 }}>
          {results.map((a) => (
            <button type="button" key={a.id} onClick={() => pick(a)}>
              {a.name}
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <form onSubmit={submit} style={{ marginTop: 14 }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            Editing: {selected.name}
          </div>
          <div className="row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Artist name" />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
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
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="Spotify artist URL (optional)"
            />
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL (optional)"
            />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="primary" disabled={busy} type="submit">
              {busy ? "Working…" : "Update artist"}
            </button>
          </div>
        </form>
      ) : (
        <div className="muted" style={{ marginTop: 12 }}>
          Search and select an artist to edit.
        </div>
      )}

      {message ? <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{message}</div> : null}
    </div>
  );
}

