import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Genre, SongDto } from "../api/types";
import { ADMIN_KEY_STORAGE } from "./AdminDashboardPage";

const GENRES: Genre[] = [
  "ROCK",
  "METAL",
  "POP",
  "JAZZ",
  "HIPHOP",
  "ELECTRONIC",
  "CLASSICAL",
  "COUNTRY",
  "INDIE",
  "OTHER"
];

type PatchSong = {
  title?: string;
  genre?: Genre;
  artistId?: string | null;
  artistName?: string;
  albumName?: string | null;
  releaseYear?: number | null;
  imageUrl?: string | null;
  songUrl?: string;
};

export default function AdminEditSongPage() {
  const [adminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) ?? "dev-admin-key");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongDto[]>([]);
  const [selected, setSelected] = useState<SongDto | null>(null);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Genre>("ROCK");
  const [artistId, setArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [songUrl, setSongUrl] = useState("");

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.songs.search(q);
      setResults(res);
      if (res.length === 0) setMessage("No songs found.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function pickFromSearch(s: SongDto) {
    setBusy(true);
    setMessage(null);
    try {
      const full = await api.songs.get(s.id);
      setSelected(full);
      setTitle(full.title ?? "");
      setGenre(full.genre);
      setArtistId(full.artistId ?? "");
      setArtistName(full.artistName ?? "");
      setAlbumName(full.albumName ?? "");
      setReleaseYear(full.releaseYear == null ? "" : String(full.releaseYear));
      setImageUrl(full.imageUrl ?? "");
      setSongUrl(full.songUrl ?? "");
      setMessage(`Selected song: ${full.title}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const patch: PatchSong = {};

    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== selected.title) patch.title = trimmedTitle;

    if (genre !== selected.genre) patch.genre = genre;

    const nextArtistId = artistId.trim() || null;
    if ((selected.artistId ?? null) !== nextArtistId) patch.artistId = nextArtistId;

    const trimmedArtistName = artistName.trim();
    if (trimmedArtistName && trimmedArtistName !== selected.artistName) patch.artistName = trimmedArtistName;

    const nextAlbumName = albumName.trim() || null;
    if ((selected.albumName ?? null) !== nextAlbumName) patch.albumName = nextAlbumName;

    const nextYear = releaseYear.trim() ? Number(releaseYear.trim()) : null;
    if ((selected.releaseYear ?? null) !== nextYear) patch.releaseYear = nextYear;

    const nextImageUrl = imageUrl.trim() || null;
    if ((selected.imageUrl ?? null) !== nextImageUrl) patch.imageUrl = nextImageUrl;

    const trimmedSongUrl = songUrl.trim();
    if (trimmedSongUrl && trimmedSongUrl !== selected.songUrl) patch.songUrl = trimmedSongUrl;

    if (Object.keys(patch).length === 0) {
      setMessage("No changes to update.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const updated = await api.songs.update(adminKey, selected.id, patch);
      setSelected(updated);
      setMessage(`Updated song: ${updated.title}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    const confirmed = window.confirm(`Delete "${selected.title}" by ${selected.artistName}?`);
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      await api.songs.delete(adminKey, selected.id);
      setResults((current) => current.filter((song) => song.id !== selected.id));
      setSelected(null);
      setTitle("");
      setArtistId("");
      setArtistName("");
      setAlbumName("");
      setReleaseYear("");
      setImageUrl("");
      setSongUrl("");
      setMessage("Deleted song.");
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
          <h2 style={{ margin: 0 }}>Edit song</h2>
          <div className="muted">Search, select, then PATCH only changed fields.</div>
        </div>
        <Link className="pill" to="/admin">
          ← Admin
        </Link>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs…" />
        <button type="button" onClick={search} disabled={!canSearch || busy}>
          {busy ? "Working…" : "Search"}
        </button>
      </div>

      {results.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Song</th>
                <th>Artist</th>
                <th>Genre</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 15).map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{s.artistName}</td>
                  <td>{s.genre}</td>
                  <td>
                    <button type="button" onClick={() => pickFromSearch(s)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selected ? (
        <form onSubmit={submit} style={{ marginTop: 14 }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            Editing: {selected.title} <span className="muted">({selected.id})</span>
          </div>
          <div className="row">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" />
            <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)}>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input value={artistId} onChange={(e) => setArtistId(e.target.value)} placeholder="Artist ID (optional)" />
            <input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Artist name"
            />
            <input value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="Album name (optional)" />
            <input
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              placeholder="Release year (optional)"
              inputMode="numeric"
            />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" />
            <input value={songUrl} onChange={(e) => setSongUrl(e.target.value)} placeholder="Spotify track URL" />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="primary" disabled={busy} type="submit">
              {busy ? "Working…" : "Update song"}
            </button>
            <button type="button" disabled={busy} onClick={deleteSelected}>
              Delete song
            </button>
          </div>
        </form>
      ) : (
        <div className="muted" style={{ marginTop: 12 }}>
          Search and pick a song to edit.
        </div>
      )}

      {message ? <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{message}</div> : null}
    </div>
  );
}
