import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getAuthToken } from "../api/client";
import { SongDetailModal } from "../components/SongDetailModal";
import type { ExternalSongResult, ExternalArtist, ExternalAlbumResult, SongDto } from "../api/types";

type ArtistInfo = {
  summary: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
};

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalResults, setExternalResults] = useState<ExternalSongResult[]>([]);
  const [externalArtists, setExternalArtists] = useState<ExternalArtist[]>([]);
  const [artistInfoCache, setArtistInfoCache] = useState<Record<string, ArtistInfo | null>>({});
  const [artistImages, setArtistImages] = useState<Record<string, string | null>>({});
  const [externalAlbums, setExternalAlbums] = useState<ExternalAlbumResult[]>([]);
  const [activeType, setActiveType] = useState<"songs" | "artists" | "albums">("songs");
  const [existingSongData, setExistingSongData] = useState<Record<string, SongDto | null>>({});
  const [myRatings, setMyRatings] = useState<Record<string, number | null>>({});
  const [selectedSong, setSelectedSong] = useState<ExternalSongResult | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ExternalArtist | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<ExternalAlbumResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [expandedAlbumSongId, setExpandedAlbumSongId] = useState<string | null>(null);
  const [expandedArtistSongId, setExpandedArtistSongId] = useState<string | null>(null);
  const [inlineRatings, setInlineRatings] = useState<Record<string, string>>({});
  const [ratingSongId, setRatingSongId] = useState<string | null>(null);
  const [albumSongs, setAlbumSongs] = useState<ExternalSongResult[]>([]);
  const [albumSongsLoading, setAlbumSongsLoading] = useState(false);
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
  const [artistImageUrl, setArtistImageUrl] = useState<string | null>(null);
  const [artistDetailLoading, setArtistDetailLoading] = useState(false);
  const [artistTopSongs, setArtistTopSongs] = useState<ExternalSongResult[]>([]);
  const [artistOtherSongs, setArtistOtherSongs] = useState<ExternalSongResult[]>([]);
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

  function getSongIdentity(song: Pick<ExternalSongResult, "title" | "artistName">) {
    return `${normalizeText(song.title)}::${normalizeText(song.artistName)}`;
  }

  function getPreviewUrlFromSongUrl(songUrl: string | null) {
    if (!songUrl) return null;
    return /\.(m4a|mp3|aac)(\?|$)/i.test(songUrl) ? songUrl : null;
  }

  function getCachedArtistImage(artist: ExternalArtist) {
    return artistImages[artist.id] ?? artistImages[normalizeText(artist.name)] ?? null;
  }

  function getCachedArtistInfo(artist: ExternalArtist) {
    return artistInfoCache[artist.id] ?? artistInfoCache[normalizeText(artist.name)] ?? null;
  }

  function rememberArtistImage(artist: ExternalArtist, imageUrl: string | null) {
    setArtistImages((current) => ({
      ...current,
      [artist.id]: imageUrl,
      [normalizeText(artist.name)]: imageUrl
    }));
  }

  function rememberArtistInfo(artist: ExternalArtist, info: ArtistInfo | null) {
    setArtistInfoCache((current) => ({
      ...current,
      [artist.id]: info,
      [normalizeText(artist.name)]: info
    }));
  }

  function songDtoToExternal(song: SongDto): ExternalSongResult {
    return {
      id: song.id,
      title: song.title,
      artistName: song.artistName,
      albumName: song.albumName,
      genre: song.genre,
      imageUrl: song.imageUrl,
      previewUrl: getPreviewUrlFromSongUrl(song.songUrl)
    };
  }

  function dedupeSongs(songs: ExternalSongResult[]) {
    const seen = new Set<string>();
    return songs.filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }

  async function loadRatingDataForSongs(songs: ExternalSongResult[]) {
    const hasAuth = Boolean(getAuthToken());
    const pairs = await Promise.all(
      songs.map(async (s) => {
        const data = await api.songs.get(s.id).catch(() => null);
        return [s.id, data] as const;
      })
    );
    setExistingSongData((current) => ({ ...current, ...Object.fromEntries(pairs) }));

    if (!hasAuth) return;

    const ratingPairs = await Promise.all(
      songs.map(async (s) => {
        const mine = await api.songs.myRating(s.id).then(r => r.value).catch(() => null);
        return [s.id, mine] as const;
      })
    );
    setMyRatings((current) => ({ ...current, ...Object.fromEntries(ratingPairs) }));
  }

  async function loadWikipediaArtistInfo(artistName: string): Promise<ArtistInfo | null> {
    type WikiSummaryResponse = {
      title?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
      thumbnail?: { source?: string };
    };
    type WikiSearchPage = {
      pageid: number;
      title: string;
      extract?: string;
      fullurl?: string;
      thumbnail?: { source?: string };
    };
    type WikiSearchResponse = {
      query?: {
        pages?: Record<string, WikiSearchPage>;
      };
    };

    function getMusicPageScore(title: string, extract: string | null | undefined) {
      const text = normalizeText(`${title} ${extract ?? ""}`);
      const artist = normalizeText(artistName);
      let score = 0;
      if (normalizeText(title) === artist) score += 8;
      else if (normalizeText(title).includes(artist)) score += 5;
      else if (text.includes(artist)) score += 2;
      if (/\b(band|rock band|music group|musical group|musician|singer|rapper|artist|recording artist|songwriter)\b/.test(text)) {
        score += 6;
      }
      if (normalizeText(title) === `${artist} band` || normalizeText(title) === `${artist} musician`) {
        score += 5;
      }
      if (/\b(ecology|desert|geography|plant|animal|water|irrigation|wells)\b/.test(text)) {
        score -= 6;
      }
      return score;
    }

    const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`).catch(() => null);
    if (summaryResponse?.ok) {
      const summary = (await summaryResponse.json()) as WikiSummaryResponse;
      if (getMusicPageScore(summary.title ?? artistName, summary.extract) > 6) {
        return {
          summary: summary.extract ?? null,
          imageUrl: summary.thumbnail?.source ?? null,
          sourceUrl: summary.content_urls?.desktop?.page ?? null
        };
      }
    }

    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `${artistName} band musician singer`,
      gsrlimit: "5",
      prop: "extracts|pageimages|info",
      exintro: "1",
      explaintext: "1",
      piprop: "thumbnail",
      pithumbsize: "600",
      inprop: "url",
      format: "json",
      origin: "*"
    });

    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
    if (!response.ok) return null;

    const data = (await response.json()) as WikiSearchResponse;
    const pages = Object.values(data.query?.pages ?? {});
    const scoredPages = pages
      .map((candidate) => ({ candidate, score: getMusicPageScore(candidate.title, candidate.extract) }))
      .sort((a, b) => b.score - a.score)[0]?.candidate;
    const page = scoredPages;
    if (!page) return null;

    return {
      summary: page.extract ?? null,
      imageUrl: page.thumbnail?.source ?? null,
      sourceUrl: page.fullurl ?? null
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    setParams(trimmed ? { q: trimmed } : {});
    if (!trimmed) {
      setHasSearched(false);
      setExternalResults([]);
      setExternalArtists([]);
      setArtistInfoCache({});
      setArtistImages({});
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

      const artistInfoPairs = await Promise.all(
        artistsData.artists.slice(0, 5).map(async (artist) => {
          const info = await loadWikipediaArtistInfo(artist.name).catch(() => null);
          return [artist, info] as const;
        })
      );
      const nextArtistInfoCache = Object.fromEntries(
        artistInfoPairs.flatMap(([artist, info]) => [
          [artist.id, info],
          [normalizeText(artist.name), info]
        ])
      );
      const imageEntries = artistInfoPairs.flatMap(([artist, info]) => {
        const fallbackImageUrl = songsData.results.find(
          (song) => normalizeText(song.artistName) === normalizeText(artist.name) && song.imageUrl
        )?.imageUrl ?? null;
        const imageUrl = info?.imageUrl ?? getLargeArtworkUrl(fallbackImageUrl);
        return [
          [artist.id, imageUrl],
          [normalizeText(artist.name), imageUrl]
        ] as const;
      });

      setExternalResults(songsData.results);
      setExternalArtists(artistsData.artists);
      setArtistInfoCache(nextArtistInfoCache);
      setArtistImages(Object.fromEntries(imageEntries));
      setExternalAlbums(albumsData.results);
      setExpandedSongId(null);

      const topShown = songsData.results.slice(0, 5);
      setExistingSongData({});
      setMyRatings({});
      await loadRatingDataForSongs(topShown);
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

  function openSongDetail(song: ExternalSongResult, options?: { closeAlbum?: boolean }) {
    if (options?.closeAlbum) {
      closeAlbumDetail();
    }
    setSelectedSong(song);
    setIsModalOpen(true);
  }

  function closeSongDetail() {
    setIsModalOpen(false);
    setSelectedSong(null);
  }

  async function openArtistDetail(artist: ExternalArtist) {
    const cachedInfo = getCachedArtistInfo(artist);
    setSelectedArtist(artist);
    setArtistDetailLoading(true);
    setArtistInfo(cachedInfo);
    setArtistImageUrl(cachedInfo?.imageUrl ?? getCachedArtistImage(artist));
    setArtistTopSongs([]);
    setArtistOtherSongs([]);
    setExpandedArtistSongId(null);

    try {
      const artistName = normalizeText(artist.name);
      const [resolvedInfo, topSongs, otherSongsData] = await Promise.all([
        cachedInfo ? Promise.resolve(cachedInfo) : loadWikipediaArtistInfo(artist.name).catch(() => null),
        api.songs.top().catch(() => []),
        api.songs.searchExternal(artist.name, 18, 0).catch(() => ({ results: [] }))
      ]);

      const topMatches = topSongs
        .filter((song) => normalizeText(song.artistName) === artistName)
        .slice(0, 5);
      const nextTopSongs = topMatches.map(songDtoToExternal);
      const topSongKeys = new Set(nextTopSongs.map(getSongIdentity));
      const nextOtherSongs = dedupeSongs(otherSongsData.results)
        .filter((song) => normalizeText(song.artistName) === artistName)
        .filter((song) => !topSongKeys.has(getSongIdentity(song)))
        .slice(0, 8);
      const fallbackImageUrl =
        nextTopSongs.find((song) => song.imageUrl)?.imageUrl ??
        otherSongsData.results.find((song) => song.imageUrl)?.imageUrl ??
        null;

      const resolvedImageUrl = resolvedInfo?.imageUrl ?? getCachedArtistImage(artist) ?? getLargeArtworkUrl(fallbackImageUrl);
      setArtistInfo(resolvedInfo);
      setArtistImageUrl(resolvedImageUrl);
      rememberArtistInfo(artist, resolvedInfo);
      rememberArtistImage(artist, resolvedImageUrl);
      setArtistTopSongs(nextTopSongs);
      setArtistOtherSongs(nextOtherSongs);
      setExistingSongData((current) => ({
        ...current,
        ...Object.fromEntries(topMatches.map((song) => [song.id, song] as const))
      }));
      await loadRatingDataForSongs([...nextTopSongs, ...nextOtherSongs]);
    } finally {
      setArtistDetailLoading(false);
    }
  }

  function closeArtistDetail() {
    setSelectedArtist(null);
    setArtistInfo(null);
    setArtistImageUrl(null);
    setArtistDetailLoading(false);
    setArtistTopSongs([]);
    setArtistOtherSongs([]);
    setExpandedArtistSongId(null);
  }

  async function openAlbumDetail(album: ExternalAlbumResult) {
    setSelectedAlbum(album);
    setAlbumSongs([]);
    setExpandedAlbumSongId(null);
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

      const nextAlbumSongs = (preferred.length > 0 ? preferred : merged).slice(0, 8);
      setAlbumSongs(nextAlbumSongs);
      await loadRatingDataForSongs(nextAlbumSongs);
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
    setExpandedAlbumSongId(null);
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
                      {getCachedArtistImage(artist) ? (
                        <img
                          className="artist-thumb"
                          src={getLargeArtworkUrl(getCachedArtistImage(artist)) ?? getCachedArtistImage(artist) ?? undefined}
                          alt={artist.name}
                        />
                      ) : (
                        <div className="artist-avatar" aria-hidden="true">
                          {artist.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
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
          <div className="app-modal app-modal-wide artist-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="app-modal-close" type="button" onClick={closeArtistDetail}>✕</button>
            <div className="artist-dialog-head">
              {artistImageUrl ? (
                <img
                  className="artist-dialog-image"
                  src={artistImageUrl}
                  alt={selectedArtist.name}
                />
              ) : (
                <div className="artist-avatar artist-avatar-large" aria-hidden="true">
                  {selectedArtist.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3>{selectedArtist.name}</h3>
                <div className="muted">
                  {[selectedArtist.type, selectedArtist.country, selectedArtist.beginDate].filter(Boolean).join(" · ") || "Artist"}
                </div>
              </div>
            </div>

            {artistDetailLoading ? (
              <div className="artist-summary muted">Loading artist details...</div>
            ) : artistInfo?.summary ? (
              <div className="artist-summary">
                {artistInfo.summary}
              </div>
            ) : (
              <div className="artist-summary muted">
                No artist biography found. Showing available catalog and RiffRank details.
              </div>
            )}

            <div className="detail-grid">
              {selectedArtist.country ? <div><span>Country</span><strong>{selectedArtist.country}</strong></div> : null}
              {selectedArtist.gender ? <div><span>Gender</span><strong>{selectedArtist.gender}</strong></div> : null}
              {selectedArtist.beginDate ? <div><span>Started</span><strong>{selectedArtist.beginDate}</strong></div> : null}
              {selectedArtist.endDate ? <div><span>Ended</span><strong>{selectedArtist.endDate}</strong></div> : null}
            </div>

            <h4 className="dialog-section-title">Songs in the Top 100</h4>
            {artistDetailLoading ? (
              <div className="muted">Loading songs...</div>
            ) : artistTopSongs.length === 0 ? (
              <div className="muted">No songs by this artist are currently in the RiffRank Top 100.</div>
            ) : (
              <div className="dialog-song-list artist-song-results-list">
                {artistTopSongs.map((song) => (
                  <div
                    key={`artist-top-${song.id}`}
                    className={`song-result artist-song-result ${expandedArtistSongId === song.id ? "is-expanded" : ""}`}
                  >
                    <div className="song-result-header artist-song-result-header">
                      <div className="song-result-main">
                        <span className="song-result-title">{song.title}</span>
                        <span className="song-result-meta">
                          {song.artistName}
                          {song.albumName ? ` · ${song.albumName}` : ""}
                          {song.genre ? ` · ${song.genre}` : ""}
                        </span>
                        {myRatings[song.id] != null ? (
                          <span className="song-result-yours">You rated this {myRatings[song.id]}/10</span>
                        ) : null}
                      </div>
                      <div className="song-result-rating">
                        {(() => {
                          const summary = getRatingSummary(song.id);
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
                      {getLargeArtworkUrl(song.imageUrl) ? (
                        <img
                          className="song-result-thumb"
                          src={getLargeArtworkUrl(song.imageUrl) ?? undefined}
                          alt={song.albumName || song.title}
                        />
                      ) : (
                        <span className="song-result-thumb song-result-thumb-empty" aria-hidden="true">
                          Note
                        </span>
                      )}
                      <button
                        type="button"
                        className="song-result-toggle"
                        onClick={() => setExpandedArtistSongId((current) => current === song.id ? null : song.id)}
                        aria-expanded={expandedArtistSongId === song.id}
                        aria-label={expandedArtistSongId === song.id ? `Hide details for ${song.title}` : `Show details for ${song.title}`}
                      >
                        <span className="song-result-caret" aria-hidden="true">
                          {expandedArtistSongId === song.id ? "⌃" : "⌄"}
                        </span>
                      </button>
                    </div>

                    {expandedArtistSongId === song.id ? (
                      <div className="song-result-panel">
                        <div className="song-result-panel-body">
                          <div className="song-result-preview">
                            {song.previewUrl ? (
                              <audio controls className="song-inline-audio">
                                <source src={song.previewUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            ) : (
                              <div className="muted">No preview available for this song.</div>
                            )}
                          </div>

                          <div className="song-result-actions">
                            <button type="button" onClick={() => openSongDetail(song, { closeAlbum: true })}>
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

            <h4 className="dialog-section-title">More songs by this artist</h4>
            {artistDetailLoading ? (
              <div className="muted">Loading more songs...</div>
            ) : artistOtherSongs.length === 0 ? (
              <div className="muted">No additional songs found for this artist.</div>
            ) : (
              <div className="dialog-song-list artist-song-results-list">
                {artistOtherSongs.map((song) => (
                  <div
                    key={`artist-other-${song.id}`}
                    className={`song-result artist-song-result ${expandedArtistSongId === song.id ? "is-expanded" : ""}`}
                  >
                    <div className="song-result-header artist-song-result-header">
                      <div className="song-result-main">
                        <span className="song-result-title">{song.title}</span>
                        <span className="song-result-meta">
                          {song.artistName}
                          {song.albumName ? ` · ${song.albumName}` : ""}
                          {song.genre ? ` · ${song.genre}` : ""}
                        </span>
                        {myRatings[song.id] != null ? (
                          <span className="song-result-yours">You rated this {myRatings[song.id]}/10</span>
                        ) : null}
                      </div>
                      <div className="song-result-rating">
                        {(() => {
                          const summary = getRatingSummary(song.id);
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
                      {getLargeArtworkUrl(song.imageUrl) ? (
                        <img
                          className="song-result-thumb"
                          src={getLargeArtworkUrl(song.imageUrl) ?? undefined}
                          alt={song.albumName || song.title}
                        />
                      ) : (
                        <span className="song-result-thumb song-result-thumb-empty" aria-hidden="true">
                          Note
                        </span>
                      )}
                      <button
                        type="button"
                        className="song-result-toggle"
                        onClick={() => setExpandedArtistSongId((current) => current === song.id ? null : song.id)}
                        aria-expanded={expandedArtistSongId === song.id}
                        aria-label={expandedArtistSongId === song.id ? `Hide details for ${song.title}` : `Show details for ${song.title}`}
                      >
                        <span className="song-result-caret" aria-hidden="true">
                          {expandedArtistSongId === song.id ? "⌃" : "⌄"}
                        </span>
                      </button>
                    </div>

                    {expandedArtistSongId === song.id ? (
                      <div className="song-result-panel">
                        <div className="song-result-panel-body">
                          <div className="song-result-preview">
                            {song.previewUrl ? (
                              <audio controls className="song-inline-audio">
                                <source src={song.previewUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            ) : (
                              <div className="muted">No preview available for this song.</div>
                            )}
                          </div>

                          <div className="song-result-actions">
                            <button type="button" onClick={() => openSongDetail(song, { closeAlbum: true })}>
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

            <div className="dialog-actions">
              {artistInfo?.sourceUrl || selectedArtist.wikipediaUrl ? (
                <a className="button" href={artistInfo?.sourceUrl || selectedArtist.wikipediaUrl || undefined} target="_blank" rel="noopener noreferrer">
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
          <div className="app-modal app-modal-wide album-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="app-modal-close" type="button" onClick={closeAlbumDetail}>✕</button>

            <div className="album-detail-hero">
              {getLargeArtworkUrl(selectedAlbum.imageUrl) ? (
                <img
                  className="album-detail-art"
                  src={getLargeArtworkUrl(selectedAlbum.imageUrl) ?? undefined}
                  alt={selectedAlbum.title}
                />
              ) : (
                <div className="album-detail-art album-detail-art-empty" aria-hidden="true">Album</div>
              )}

              <div className="album-detail-copy">
                <div className="song-detail-kicker">Album view</div>
                <h3 className="album-detail-title">{selectedAlbum.title}</h3>
                <div className="album-detail-artist">by {selectedAlbum.artistName}</div>
                <div className="dialog-actions album-detail-actions">
                  <a
                    className="button album-detail-primary-action"
                    href={selectedAlbum.albumUrl || `https://music.apple.com/search?term=${encodeURIComponent(selectedAlbum.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in iTunes
                  </a>
                </div>
              </div>
            </div>

            <h4 className="dialog-section-title album-detail-section-title">Songs</h4>
            {albumSongsLoading ? (
              <div className="muted">Loading songs...</div>
            ) : albumSongs.length === 0 ? (
              <div className="muted">No songs found for this album.</div>
            ) : (
              <div className="dialog-song-list album-song-results-list">
                {albumSongs.map((song) => (
                  <div
                    key={song.id}
                    className={`song-result album-song-result ${expandedAlbumSongId === song.id ? "is-expanded" : ""}`}
                  >
                    <div className="song-result-header album-song-result-header">
                      <div className="song-result-main">
                        <span className="song-result-title">{song.title}</span>
                        <span className="song-result-meta">
                          {song.artistName}
                          {song.albumName ? ` · ${song.albumName}` : ""}
                          {song.genre ? ` · ${song.genre}` : ""}
                        </span>
                        {myRatings[song.id] != null ? (
                          <span className="song-result-yours">You rated this {myRatings[song.id]}/10</span>
                        ) : null}
                      </div>
                      <div className="song-result-rating">
                        {(() => {
                          const summary = getRatingSummary(song.id);
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
                      {getLargeArtworkUrl(song.imageUrl) ? (
                        <img
                          className="song-result-thumb"
                          src={getLargeArtworkUrl(song.imageUrl) ?? undefined}
                          alt={song.albumName || song.title}
                        />
                      ) : (
                        <span className="song-result-thumb song-result-thumb-empty" aria-hidden="true">
                          Note
                        </span>
                      )}
                      <button
                        type="button"
                        className="song-result-toggle"
                        onClick={() => setExpandedAlbumSongId((current) => current === song.id ? null : song.id)}
                        aria-expanded={expandedAlbumSongId === song.id}
                        aria-label={expandedAlbumSongId === song.id ? `Hide details for ${song.title}` : `Show details for ${song.title}`}
                      >
                        <span className="song-result-caret" aria-hidden="true">
                          {expandedAlbumSongId === song.id ? "⌃" : "⌄"}
                        </span>
                      </button>
                    </div>

                    {expandedAlbumSongId === song.id ? (
                      <div className="song-result-panel">
                        <div className="song-result-panel-body">
                          <div className="song-result-preview">
                            {song.previewUrl ? (
                              <audio controls className="song-inline-audio">
                                <source src={song.previewUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            ) : (
                              <div className="muted">No preview available for this song.</div>
                            )}
                          </div>

                          <div className="song-result-actions">
                            <button type="button" onClick={() => openSongDetail(song)}>
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
        </div>
      )}
    </div>
  );
}
