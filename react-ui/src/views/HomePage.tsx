import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getAuthToken } from "../api/client";
import { SongDetailModal } from "../components/SongDetailModal";
import type { ExternalSongResult, ExternalArtist, ExternalAlbumResult, SongDto } from "../api/types";

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
  const [existingSongData, setExistingSongData] = useState<Record<string, SongDto | null>>({});
  const [myRatings, setMyRatings] = useState<Record<string, number | null>>({});
  const [selectedSong, setSelectedSong] = useState<ExternalSongResult | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ExternalArtist | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<ExternalAlbumResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [inlineRatings, setInlineRatings] = useState<Record<string, string>>({});
  const [ratingSongId, setRatingSongId] = useState<string | null>(null);
  const [albumSongs, setAlbumSongs] = useState<ExternalSongResult[]>([]);
  const [albumSongsLoading, setAlbumSongsLoading] = useState(false);
  const limit = 5;

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  function getLargeArtworkUrl(imageUrl: string | null) {
    return imageUrl?.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, "/600x600bb.$1") ?? null;
  }

  function formatCompactRatingCount(count: number) {
    if (count < 1000) {
      return `${count} ${count === 1 ? "rating" : "ratings"}`;
    }

    return `${Math.floor(count / 1000)}k ratings`;
  }

  function normalizeText(value: string | null | undefined) {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function dedupeSongs(songs: ExternalSongResult[]) {
    const seen = new Set<string>();
    return songs.filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    setParams(trimmed ? { q: trimmed } : {});
    if (!trimmed) {
      setHasSearched(false);
      setExternalResults([]);
      setExternalArtists([]);
      setExternalAlbums([]);
      setExpandedSongId(null);
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
      setExpandedSongId(null);

      // Fetch any existing rating data for the shown songs (best-effort).
      const topShown = songsData.results.slice(0, 5);
      const hasAuth = Boolean(getAuthToken());
      const pairs = await Promise.all(
        topShown.map(async (s) => {
          const data = await api.songs.get(s.id).catch(() => null);
          return [s.id, data] as const;
        })
      );
      setExistingSongData(Object.fromEntries(pairs));

      if (hasAuth) {
        const ratingPairs = await Promise.all(
          topShown.map(async (s) => {
            const mine = await api.songs.myRating(s.id).then(r => r.value).catch(() => null);
            return [s.id, mine] as const;
          })
        );
        setMyRatings(Object.fromEntries(ratingPairs));
      } else {
        setMyRatings({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onRateExternal(externalSong: ExternalSongResult, rating: number) {
    try {
      // Rate the song - if it doesn't exist, it will be created automatically with the provided details
      await api.songs.rate(externalSong.id, rating, {
        title: externalSong.title,
        genre: externalSong.genre,
        artistName: externalSong.artistName,
        albumName: externalSong.albumName,
        imageUrl: externalSong.imageUrl,
        songUrl: externalSong.previewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(externalSong.title)}`
      });
      const updated = await api.songs.get(externalSong.id).catch(() => null);
      setExistingSongData((current) => ({ ...current, [externalSong.id]: updated }));
      setMyRatings((current) => ({ ...current, [externalSong.id]: rating }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401")) {
        alert("Please sign in to rate songs.");
        return;
      }
      alert("Error saving and rating song: " + msg);
    }
  }

  function openSongDetail(song: ExternalSongResult) {
    setSelectedSong(song);
    setIsModalOpen(true);
  }

  function closeSongDetail() {
    setIsModalOpen(false);
    setSelectedSong(null);
  }

  function openArtistDetail(artist: ExternalArtist) {
    setSelectedArtist(artist);
  }

  function closeArtistDetail() {
    setSelectedArtist(null);
  }

  async function openAlbumDetail(album: ExternalAlbumResult) {
    setSelectedAlbum(album);
    setAlbumSongs([]);
    setAlbumSongsLoading(true);
    try {
      const queries = [
        `${album.title} ${album.artistName}`.trim(),
        album.title,
        album.artistName
      ].filter(Boolean);

      const results = await Promise.all(
        queries.map((query) => api.songs.searchExternal(query, 12, 0).catch(() => ({ results: [] })))
      );

      const merged = dedupeSongs(results.flatMap((entry) => entry.results));
      const albumTitle = normalizeText(album.title);
      const albumArtist = normalizeText(album.artistName);
      const preferred = merged
        .map((song) => {
          const songAlbum = normalizeText(song.albumName);
          const songArtist = normalizeText(song.artistName);
          const albumMatch = songAlbum === albumTitle ? 3 : songAlbum.includes(albumTitle) ? 2 : 0;
          const artistMatch = songArtist === albumArtist ? 2 : songArtist.includes(albumArtist) ? 1 : 0;
          const previewBonus = song.previewUrl ? 1 : 0;
          return { song, score: albumMatch + artistMatch + previewBonus };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ song }) => song);

      setAlbumSongs((preferred.length > 0 ? preferred : merged).slice(0, 8));
    } catch {
      setAlbumSongs([]);
    } finally {
      setAlbumSongsLoading(false);
    }
  }

  function closeAlbumDetail() {
    setSelectedAlbum(null);
    setAlbumSongs([]);
    setAlbumSongsLoading(false);
  }

  async function handleModalRate(rating: number) {
    if (!selectedSong) return;
    await onRateExternal(selectedSong, rating);
  }

  async function handleInlineRate(song: ExternalSongResult, nextRating?: string) {
    const rating = Number(nextRating ?? inlineRatings[song.id]);
    if (!rating) return;

    setRatingSongId(song.id);
    try {
      await onRateExternal(song, rating);
      setInlineRatings((current) => ({ ...current, [song.id]: "" }));
    } finally {
      setRatingSongId(null);
    }
  }

  function getRatingSummary(songId: string) {
    const songData = existingSongData[songId];
    if (!songData || songData.ratingCount === 0) {
      return { value: "No ratings", count: "Rate it" };
    }

    return {
      value: `${songData.actualRating?.toFixed(1) ?? "N/A"}/10`,
      count: formatCompactRatingCount(songData.ratingCount)
    };
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
                <div className="song-results-list">
                  {externalResults.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className={`song-result ${expandedSongId === s.id ? "is-expanded" : ""}`}
                    >
                      <div className="song-result-header">
                        <div className="song-result-main">
                          <span className="song-result-title">{s.title}</span>
                          <span className="song-result-meta">
                            {s.artistName}
                            {s.albumName ? ` · ${s.albumName}` : ""}
                            {s.genre ? ` · ${s.genre}` : ""}
                          </span>
                          {myRatings[s.id] != null ? (
                            <span className="song-result-yours">You rated this {myRatings[s.id]}/10</span>
                          ) : null}
                        </div>
                        <div className="song-result-rating">
                          {(() => {
                            const summary = getRatingSummary(s.id);
                            return (
                              <>
                                <strong>{summary.value}</strong>
                                <span>{summary.count}</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="song-result-rate song-result-rate-main">
                          <select
                            value={inlineRatings[s.id] ?? ""}
                            onChange={(e) => {
                              const nextRating = e.target.value;
                              setInlineRatings((current) => ({
                                ...current,
                                [s.id]: nextRating
                              }));
                              handleInlineRate(s, nextRating);
                            }}
                            disabled={ratingSongId === s.id}
                            aria-label={`Rate ${s.title}`}
                          >
                            <option value="">{ratingSongId === s.id ? "Saving..." : "Rate"}</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <option key={num} value={num}>
                                {num}/10
                              </option>
                            ))}
                          </select>
                        </div>
                        {getLargeArtworkUrl(s.imageUrl) ? (
                          <img
                            className="song-result-thumb"
                            src={getLargeArtworkUrl(s.imageUrl) ?? undefined}
                            alt={s.albumName || s.title}
                          />
                        ) : (
                          <span className="song-result-thumb song-result-thumb-empty" aria-hidden="true">
                            Note
                          </span>
                        )}
                        <button
                          type="button"
                          className="song-result-toggle"
                          onClick={() => setExpandedSongId((current) => current === s.id ? null : s.id)}
                          aria-expanded={expandedSongId === s.id}
                          aria-label={expandedSongId === s.id ? `Hide details for ${s.title}` : `Show details for ${s.title}`}
                        >
                          <span className="song-result-caret" aria-hidden="true">
                            {expandedSongId === s.id ? "⌃" : "⌄"}
                          </span>
                        </button>
                      </div>

                      {expandedSongId === s.id ? (
                        <div className="song-result-panel">
                          <div className="song-result-panel-body">
                            <div className="song-result-preview">
                              {s.previewUrl ? (
                                <audio controls className="song-inline-audio">
                                  <source src={s.previewUrl} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              ) : (
                                <div className="muted">No preview available for this song.</div>
                              )}
                            </div>

                            <div className="song-result-actions">
                              <button type="button" onClick={() => openSongDetail(s)}>
                                Full details
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
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
                <div className="artist-results-list">
                  {externalArtists.slice(0, 5).map((artist) => (
                    <div key={artist.id} className="media-result">
                      <div className="artist-avatar" aria-hidden="true">
                        {artist.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="media-result-main">
                        <h4>{artist.name}</h4>
                        <div className="muted">
                          {[artist.type, artist.country, artist.beginDate].filter(Boolean).join(" · ") || "Artist"}
                        </div>
                      </div>
                      <button type="button" onClick={() => openArtistDetail(artist)}>
                        Details
                      </button>
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
                <div className="album-results-list">
                  {externalAlbums.slice(0, 5).map((album) => (
                    <div key={album.id} className="media-result">
                      {getLargeArtworkUrl(album.imageUrl) ? (
                        <img
                          className="album-thumb"
                          src={getLargeArtworkUrl(album.imageUrl) ?? undefined}
                          alt={album.title}
                        />
                      ) : (
                        <div className="album-thumb album-thumb-empty" aria-hidden="true">Album</div>
                      )}
                      <div className="media-result-main">
                        <h4>{album.title}</h4>
                        {album.artistName ? (
                          <div className="muted">by {album.artistName}</div>
                        ) : null}
                      </div>
                      <button type="button" onClick={() => openAlbumDetail(album)}>
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedSong && (
        <SongDetailModal
          song={selectedSong}
          isOpen={isModalOpen}
          onClose={closeSongDetail}
          onRate={handleModalRate}
        />
      )}

      {selectedArtist && (
        <div className="app-modal-overlay" onClick={closeArtistDetail}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            <button className="app-modal-close" type="button" onClick={closeArtistDetail}>✕</button>
            <div className="artist-dialog-head">
              <div className="artist-avatar artist-avatar-large" aria-hidden="true">
                {selectedArtist.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3>{selectedArtist.name}</h3>
                <div className="muted">{selectedArtist.type || "Artist"}</div>
              </div>
            </div>
            <div className="detail-grid">
              {selectedArtist.country ? <div><span>Country</span><strong>{selectedArtist.country}</strong></div> : null}
              {selectedArtist.gender ? <div><span>Gender</span><strong>{selectedArtist.gender}</strong></div> : null}
              {selectedArtist.beginDate ? <div><span>Started</span><strong>{selectedArtist.beginDate}</strong></div> : null}
              {selectedArtist.endDate ? <div><span>Ended</span><strong>{selectedArtist.endDate}</strong></div> : null}
              <div><span>Status</span><strong>{selectedArtist.ended ? "Ended" : "Active / unknown"}</strong></div>
              <div><span>Match</span><strong>{selectedArtist.score}%</strong></div>
            </div>
            <div className="dialog-actions">
              {selectedArtist.wikipediaUrl ? (
                <a className="button" href={selectedArtist.wikipediaUrl} target="_blank" rel="noopener noreferrer">
                  Wikipedia
                </a>
              ) : null}
              <a
                className="button"
                href={`https://music.apple.com/search?term=${encodeURIComponent(selectedArtist.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                iTunes
              </a>
            </div>
          </div>
        </div>
      )}

      {selectedAlbum && (
        <div className="app-modal-overlay" onClick={closeAlbumDetail}>
          <div className="app-modal app-modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="app-modal-close" type="button" onClick={closeAlbumDetail}>✕</button>
            <div className="album-dialog-head">
              {getLargeArtworkUrl(selectedAlbum.imageUrl) ? (
                <img
                  className="album-dialog-art"
                  src={getLargeArtworkUrl(selectedAlbum.imageUrl) ?? undefined}
                  alt={selectedAlbum.title}
                />
              ) : (
                <div className="album-dialog-art album-thumb-empty" aria-hidden="true">Album</div>
              )}
              <div>
                <h3>{selectedAlbum.title}</h3>
                <div className="muted">by {selectedAlbum.artistName}</div>
                <div className="dialog-actions">
                  <a
                    className="button"
                    href={selectedAlbum.albumUrl || `https://music.apple.com/search?term=${encodeURIComponent(selectedAlbum.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    iTunes
                  </a>
                </div>
              </div>
            </div>

            <h4 className="dialog-section-title">Songs</h4>
            {albumSongsLoading ? (
              <div className="muted">Loading songs...</div>
            ) : albumSongs.length === 0 ? (
              <div className="muted">No songs found for this album.</div>
            ) : (
              <div className="dialog-song-list">
                {albumSongs.map((song) => (
                  <div key={song.id} className="dialog-song-row">
                    <div className="dialog-song-main">
                      <h4>{song.title}</h4>
                      <div className="muted">{song.artistName}</div>
                      <div className="dialog-song-mini-meta">
                        <span>{song.genre}</span>
                        {song.albumName ? <span>{song.albumName}</span> : null}
                        {song.previewUrl ? <span>Preview available</span> : <span>No preview</span>}
                      </div>
                    </div>
                    <div className="dialog-song-actions">
                      <button type="button" onClick={() => openSongDetail(song)}>
                        Preview and rate
                      </button>
                      <select
                        value={inlineRatings[song.id] ?? ""}
                        onChange={(e) => {
                          const nextRating = e.target.value;
                          setInlineRatings((current) => ({
                            ...current,
                            [song.id]: nextRating
                          }));
                          handleInlineRate(song, nextRating);
                        }}
                        disabled={ratingSongId === song.id}
                        aria-label={`Rate ${song.title}`}
                      >
                        <option value="">{ratingSongId === song.id ? "Saving..." : "Rate"}</option>
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
        </div>
      )}
    </div>
  );
}
