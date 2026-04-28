import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { SongDto, ExternalSongResult, ExternalArtist, ExternalArtistSearchResult } from "../api/types";

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalResults, setExternalResults] = useState<ExternalSongResult[]>([]);
  const [externalArtists, setExternalArtists] = useState<ExternalArtist[]>([]);
  const [searchType, setSearchType] = useState<"songs" | "artists">("songs");
  const [ratingState, setRatingState] = useState<Record<string, number>>({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    setParams(trimmed ? { q: trimmed } : {});
    if (!trimmed) {
      setExternalResults([]);
      setExternalArtists([]);
      return;
    }
    setLoading(true);
    setError(null);
    setOffset(0);
    try {
      if (searchType === "artists") {
        const data = await api.artists.searchExternal(trimmed, limit, 0);
        setExternalArtists(data.artists);
        setHasMore(data.artists.length === limit);
        setExternalResults([]);
      } else {
        const data = await api.songs.searchExternal(trimmed, limit, 0);
        setExternalResults(data.results);
        setHasMore(data.results.length === limit);
        setExternalArtists([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    const newOffset = offset + limit;
    try {
      if (searchType === "artists") {
        const data = await api.artists.searchExternal(q.trim(), limit, newOffset);
        setExternalArtists(prev => [...prev, ...data.artists]);
        setHasMore(data.artists.length === limit);
      } else {
        const data = await api.songs.searchExternal(q.trim(), limit, newOffset);
        setExternalResults(prev => [...prev, ...data.results]);
        setHasMore(data.results.length === limit);
      }
      setOffset(newOffset);
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
      alert("Error saving and rating song: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Search iTunes Songs & Artists</h2>
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>
            <input
              type="radio"
              checked={searchType === "songs"}
              onChange={() => setSearchType("songs")}
            />
            {" "}Search Songs
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              checked={searchType === "artists"}
              onChange={() => setSearchType("artists")}
            />
            {" "}Search Artists
          </label>
        </div>
      </div>

      <form onSubmit={onSubmit} className="row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchType === "songs" ? "Search songs…" : "Search artists…"}
        />
        <button className="primary" type="submit" disabled={!canSearch || loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      <div className="muted" style={{ marginTop: 8 }}>
        {searchType === "songs"
          ? "Examples: Bohemian Rhapsody, Enter Sandman, Imagine"
          : "Examples: Queen, Metallica, The Beatles"}
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: "#ffb4b4" }}>{error}</div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 10 }}>Results from iTunes</h3>

          {searchType === "artists" ? (
            <div>
              {externalArtists.length === 0 ? (
                <div className="muted">No artists found</div>
              ) : (
                <div>
                  {externalArtists.map((artist) => (
                    <div key={artist.id} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{artist.name}</h4>
                          {artist.type && (
                            <div className="muted" style={{ fontSize: "0.9em" }}>Genre: {artist.type}</div>
                          )}
                        </div>
                        <div>
                          <a href={`https://itunes.apple.com/search?term=${encodeURIComponent(artist.name)}`} target="_blank" rel="noopener noreferrer" className="button">
                            iTunes
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <button onClick={loadMore} disabled={loading} style={{ marginTop: 12 }}>
                      {loading ? "Loading…" : "Load More"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {externalResults.length === 0 ? (
                <div className="muted">No results yet.</div>
              ) : (
                <div>
                  {externalResults.map((s) => (
                    <div key={s.id} className="card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
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
                  {hasMore && (
                    <button onClick={loadMore} disabled={loading} style={{ marginTop: 12 }}>
                      {loading ? "Loading…" : "Load More"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
