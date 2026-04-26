import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ArtistDto, Genre } from "../api/types";
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

export default function AdminSongsPage() {
  const [adminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) ?? "dev-admin-key");

  const [createTitle, setCreateTitle] = useState("");
  const [createGenre, setCreateGenre] = useState<Genre>("ROCK");
  const [createArtistQuery, setCreateArtistQuery] = useState("");
  const [createArtistResults, setCreateArtistResults] = useState<ArtistDto[]>([]);
  const [createArtistId, setCreateArtistId] = useState("");
  const [createArtistName, setCreateArtistName] = useState("");
  const [createAlbumName, setCreateAlbumName] = useState("");
  const [createReleaseYear, setCreateReleaseYear] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [createSongUrl, setCreateSongUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canCreate = useMemo(
    () =>
      createTitle.trim().length > 0 &&
      createArtistName.trim().length > 0 &&
      createSongUrl.trim().length > 0,
    [createTitle, createArtistName, createSongUrl]
  );

  async function searchCreateArtists() {
    const q = createArtistQuery.trim();
    if (!q) {
      setCreateArtistResults([]);
      return;
    }
    try {
      const res = await api.artists.search(q);
      setCreateArtistResults(res);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  function chooseCreateArtist(a: ArtistDto) {
    setCreateArtistId(a.id);
    setCreateArtistName(a.name);
    setCreateArtistResults([]);
  }

  async function createSong(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const created = await api.songs.create(adminKey, {
        title: createTitle.trim(),
        genre: createGenre,
        artistId: createArtistId.trim() || null,
        artistName: createArtistName.trim(),
        albumName: createAlbumName.trim() || null,
        releaseYear: createReleaseYear.trim() ? Number(createReleaseYear.trim()) : null,
        imageUrl: createImageUrl.trim() || null,
        songUrl: createSongUrl.trim()
      });
      setMessage(`Created song: ${created.title} (${created.id})`);
      setCreateTitle("");
      setCreateArtistQuery("");
      setCreateArtistResults([]);
      setCreateArtistId("");
      setCreateArtistName("");
      setCreateAlbumName("");
      setCreateReleaseYear("");
      setCreateImageUrl("");
      setCreateSongUrl("");
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
          <h2 style={{ margin: 0 }}>Songs</h2>
          <div className="muted">Paste Spotify track link into Song URL.</div>
        </div>
        <Link className="pill" to="/admin">
          ← Admin
        </Link>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Create song</h3>
        <form onSubmit={createSong}>
          <div className="row">
            <input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Song title"
            />
            <select value={createGenre} onChange={(e) => setCreateGenre(e.target.value as Genre)}>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <input
              value={createArtistQuery}
              onChange={(e) => setCreateArtistQuery(e.target.value)}
              placeholder="Search existing artist (optional)"
            />
            <button type="button" onClick={searchCreateArtists} disabled={busy}>
              Search artists
            </button>
            <Link className="pill" to="/admin/artists">
              Create artist →
            </Link>
          </div>

          {createArtistResults.length > 0 ? (
            <div style={{ marginTop: 10 }} className="card">
              <div className="muted" style={{ marginBottom: 6 }}>
                Select an artist:
              </div>
              <div className="row">
                {createArtistResults.map((a) => (
                  <button type="button" key={a.id} onClick={() => chooseCreateArtist(a)}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="row" style={{ marginTop: 10 }}>
            <input
              value={createArtistId}
              onChange={(e) => setCreateArtistId(e.target.value)}
              placeholder="Artist ID (optional)"
            />
            <input
              value={createArtistName}
              onChange={(e) => setCreateArtistName(e.target.value)}
              placeholder="Artist name"
            />
            <input
              value={createAlbumName}
              onChange={(e) => setCreateAlbumName(e.target.value)}
              placeholder="Album name (optional)"
            />
            <input
              value={createReleaseYear}
              onChange={(e) => setCreateReleaseYear(e.target.value)}
              placeholder="Release year (optional)"
              inputMode="numeric"
            />
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <input
              value={createImageUrl}
              onChange={(e) => setCreateImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
            />
            <input
              value={createSongUrl}
              onChange={(e) => setCreateSongUrl(e.target.value)}
              placeholder="Spotify track URL"
            />
          </div>

          <div style={{ marginTop: 10 }} className="row">
            <button className="primary" disabled={!canCreate || busy} type="submit">
              {busy ? "Working…" : "Create song"}
            </button>
            <Link className="pill" to="/admin/songs/edit">
              Edit song
            </Link>
          </div>
        </form>
      </div>

      {message ? <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{message}</div> : null}
    </div>
  );
}
