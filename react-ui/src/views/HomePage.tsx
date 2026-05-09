import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { ExternalSongResult, ExternalArtist, ExternalAlbumResult } from "../api/types";

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalResults, setExternalResults] = useState<ExternalSongResult[]>([]);
  const [externalArtists, setExternalArtists] = useState<ExternalArtist[]>([]);
  const [externalAlbums, setExternalAlbums] = useState<ExternalAlbumResult[]>([]);
  const [activeType, setActiveType] = useState<"songs" | "artists" | "albums">("songs");
  const [ratingState, setRatingState] = useState<Record<string, number>>({});
  const limit = 5;

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    setParams(trimmed ? { q: trimmed } : {});
    if (!trimmed) {
      setHasSearched(false);
      setExternalResults([]);
      setExternalArtists([]);
      setExternalAlbums([]);
      return;
    }
    setHasSearched(true);
    setLoading(true);
    setError(null);
    try {
      const [songsData, artistsData, albumsData] = await Promise.all([
        api.songs.searchExternal(trimmed, limit, 0),
        api.artists.searchExternal(trimmed, limit, 0),
        api.songs.searchExternalAlbums(trimmed, limit)
      ]);

      setExternalResults(songsData.results);
      setExternalArtists(artistsData.artists);
      setExternalAlbums(albumsData.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onRateExternal(externalSong: ExternalSongResult, rating: number) {
    setRatingState(prev => ({ ...prev, [externalSong.id]: rating }));
    try {
      // For external songs, we need to add them to our database first
      const newSong = await api.songs.create("", {
        title: externalSong.title,
        genre: externalSong.genre,
        artistName: externalSong.artistName,
        albumName: externalSong.albumName,
        imageUrl: externalSong.imageUrl,
        songUrl: externalSong.previewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(externalSong.title)}`
      });
      // Then rate it
      await api.songs.rate(newSong.id, rating);
      alert(`Rated "${externalSong.title}" ${rating}/10 and saved to database!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401")) {
        alert("Please sign in to rate songs.");
        return;
      }
      alert("Error saving and rating song: " + msg);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Search iTunes</h2>

      <form onSubmit={onSubmit} className="row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search songs or artists…"
        />
        <button className="primary" type="submit" disabled={!canSearch || loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      <div className="muted" style={{ marginTop: 8 }}>
        Examples: Queen, Metallica, Bohemian Rhapsody, Enter Sandman
      </div>

      {!hasSearched ? null : error ? (
        <div style={{ marginTop: 12, color: "#ffb4b4" }}>{error}</div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className={activeType === "songs" ? "primary" : ""}
              onClick={() => setActiveType("songs")}
              disabled={loading}
            >
              Songs
            </button>
            <button
              type="button"
              className={activeType === "artists" ? "primary" : ""}
              onClick={() => setActiveType("artists")}
              disabled={loading}
            >
              Artists
            </button>
            <button
              type="button"
              className={activeType === "albums" ? "primary" : ""}
              onClick={() => setActiveType("albums")}
              disabled={loading}
            >
              Albums
            </button>
          </div>

          {activeType === "songs" ? (
            <div style={{ marginTop: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <h4 style={{ margin: 0 }}>Songs</h4>
                <Link className="pill" to="/admin/songs">Admin</Link>
              </div>
              {externalResults.length === 0 ? (
                <div className="muted" style={{ marginTop: 8 }}>No songs yet.</div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {externalResults.slice(0, 5).map((s) => (
                    <div key={s.id} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: 0 }}>{s.title}</h4>
                          {s.artistName && (
                            <div className="muted" style={{ fontSize: "0.9em" }}>by {s.artistName}</div>
                          )}
                          {s.albumName && (
                            <div className="muted" style={{ fontSize: "0.9em" }}>Album: {s.albumName}</div>
                          )}
                          {s.genre && (
                            <div className="muted" style={{ fontSize: "0.9em" }}>Genre: {s.genre}</div>
                          )}
                        </div>
                        <select
                          value={ratingState[s.id] || ""}
                          onChange={(e) => {
                            const rating = parseInt(e.target.value);
                            if (!isNaN(rating)) {
                              onRateExternal(s, rating);
                            }
                          }}
                          style={{ width: 120, padding: 6 }}
                        >
                          <option value="">Rate...</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>{num}/10</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeType === "artists" ? (
            <div style={{ marginTop: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <h4 style={{ margin: 0 }}>Artists</h4>
                <Link className="pill" to="/admin/artists">Admin</Link>
              </div>
              {externalArtists.length === 0 ? (
                <div className="muted" style={{ marginTop: 8 }}>No artists found</div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {externalArtists.slice(0, 5).map((artist) => (
                    <div key={artist.id} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{artist.name}</h4>
                          {artist.type && (
                            <div className="muted" style={{ fontSize: "0.9em" }}>Genre: {artist.type}</div>
                          )}
                        </div>
                        <div>
                          <a
                            href={`https://music.apple.com/search?term=${encodeURIComponent(artist.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button"
                          >
                            iTunes
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <h4 style={{ margin: 0 }}>Albums</h4>
              </div>
              {externalAlbums.length === 0 ? (
                <div className="muted" style={{ marginTop: 8 }}>No albums found</div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {externalAlbums.slice(0, 5).map((album) => (
                    <div key={album.id} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: 0 }}>{album.title}</h4>
                          {album.artistName ? (
                            <div className="muted" style={{ fontSize: "0.9em" }}>by {album.artistName}</div>
                          ) : null}
                        </div>
                        <a
                          href={album.albumUrl || `https://music.apple.com/search?term=${encodeURIComponent(album.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button"
                        >
                          iTunes
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
