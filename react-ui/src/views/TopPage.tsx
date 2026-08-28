import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { SongDetailModal } from "../components/SongDetailModal";
import type { ExternalSongResult, SongDto } from "../api/types";

const genreColorMap: Record<string, { bg: string; text: string; border: string }> = {
  ROCK: { bg: "#ff6b6b", text: "#fff", border: "#cc5555" },
  METAL: { bg: "#8b0000", text: "#fff", border: "#660000" },
  POP: { bg: "#ff69b4", text: "#fff", border: "#cc5588" },
  JAZZ: { bg: "#4169e1", text: "#fff", border: "#3355cc" },
  HIPHOP: { bg: "#696969", text: "#fff", border: "#555555" },
  ELECTRONIC: { bg: "#9932cc", text: "#fff", border: "#7722aa" },
  CLASSICAL: { bg: "#2ecc71", text: "#fff", border: "#27ae60" },
  COUNTRY: { bg: "#ff8c00", text: "#fff", border: "#cc7000" },
  INDIE: { bg: "#17a2b8", text: "#fff", border: "#138496" },
  OTHER: { bg: "#6c757d", text: "#fff", border: "#5a6268" }
};

function getLargeArtworkUrl(imageUrl: string | null) {
  return imageUrl?.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, "/600x600bb.$1") ?? null;
}

function formatRating(value: number | null | undefined) {
  return value == null ? "—" : value.toFixed(1);
}

function getPreviewUrlFromSongUrl(songUrl: string | null) {
  if (!songUrl) return null;
  return /\.(m4a|mp3|aac|wav|ogg)(\?|$)/i.test(songUrl) ? songUrl : null;
}

function getGenreStyle(genre?: string) {
  return genreColorMap[genre || "OTHER"] || genreColorMap.OTHER;
}

export default function TopPage() {
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<ExternalSongResult | null>(null);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.songs
      .top()
      .then((data) => {
        if (!cancelled) {
          setSongs(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio?.pause();
      });
    };
  }, []);

  const genreCount = useMemo(() => {
    return new Set(songs.map((song) => song.genre || "OTHER")).size;
  }, [songs]);

  const rankedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const weightedDiff = (b.weightedRating ?? Number.NEGATIVE_INFINITY) - (a.weightedRating ?? Number.NEGATIVE_INFINITY);
      if (weightedDiff !== 0) return weightedDiff;

      const votesDiff = b.ratingCount - a.ratingCount;
      if (votesDiff !== 0) return votesDiff;

      const actualDiff = (b.actualRating ?? Number.NEGATIVE_INFINITY) - (a.actualRating ?? Number.NEGATIVE_INFINITY);
      if (actualDiff !== 0) return actualDiff;

      return a.title.localeCompare(b.title);
    });
  }, [songs]);

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

  const handlePlayPause = (songId: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== songId) {
        audio?.pause();
      }
    });

    const audio = audioRefs.current[songId];
    if (!audio) return;

    if (audio.paused) {
      void audio.play().catch(() => {
        setPlayingSongId(null);
      });
      setPlayingSongId(songId);
    } else {
      audio.pause();
      setPlayingSongId(null);
    }
  };

  function openSongDetail(song: SongDto) {
    setSelectedSong(songDtoToExternal(song));
    setIsSongModalOpen(true);
  }

  function closeSongDetail() {
    setIsSongModalOpen(false);
    setSelectedSong(null);
  }

  async function handleModalRate(rating: number) {
    if (!selectedSong) return;

    await api.songs.rate(selectedSong.id, rating, {
      title: selectedSong.title,
      genre: selectedSong.genre,
      artistName: selectedSong.artistName,
      albumName: selectedSong.albumName,
      imageUrl: selectedSong.imageUrl,
      songUrl: selectedSong.previewUrl ?? undefined
    });

    const refreshed = await api.songs.top().catch(() => []);
    setSongs(refreshed);
  }

  if (loading) {
    return (
      <div className="top-page">
        <section className="card top-hero">
          <div className="top-hero-copy">
            <h1>Top 100</h1>
            <p className="muted">Loading chart.</p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-page">
        <section className="card top-hero">
          <div className="top-hero-copy">
            <h1>Top 100</h1>
            <p className="top-error">{error}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="top-page">
      <section className="card top-hero">
        <div className="top-hero-copy">
          <h1>Top 100</h1>
          <p className="muted">Current chart.</p>
        </div>

        <div className="top-hero-meta">
          <div className="top-hero-stat">
            <span className="top-hero-stat-label">Songs</span>
            <strong>{songs.length}</strong>
          </div>
          <div className="top-hero-stat">
            <span className="top-hero-stat-label">Genres</span>
            <strong>{genreCount}</strong>
          </div>
        </div>
      </section>

      <section className="top-songs-grid" aria-label="Top ranked songs">
        {rankedSongs.map((song, idx) => {
          const isPlaying = playingSongId === song.id;
          const genreStyle = getGenreStyle(song.genre);
          const artworkUrl = getLargeArtworkUrl(song.imageUrl);
          const fallbackLabel = song.artistName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "RR";

          return (
            <article key={song.id} className="top-song-card">
              <div className="rank-badge">#{idx + 1}</div>

              <div className="song-card-image-container">
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt={`${song.title} cover art`}
                    className="song-card-image"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="song-card-image song-card-fallback" aria-hidden="true">
                    {fallbackLabel}
                  </div>
                )}

                {song.songUrl ? (
                  <button
                    type="button"
                    className="song-play-button"
                    onClick={() => handlePlayPause(song.id)}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                ) : null}

                {song.songUrl ? (
                  <audio
                    ref={(el) => {
                      audioRefs.current[song.id] = el;
                    }}
                    src={song.songUrl}
                    onEnded={() => setPlayingSongId(null)}
                    onPause={() => {
                      if (playingSongId === song.id) {
                        setPlayingSongId(null);
                      }
                    }}
                  />
                ) : null}
              </div>

              <div className="song-card-info">
                <div className="song-card-head">
                  <div>
                    <button
                      type="button"
                      className="song-title-button"
                      onClick={() => openSongDetail(song)}
                    >
                      {song.title}
                    </button>
                    <div className="song-artist">{song.artistName}</div>
                  </div>
                  <div
                    className="genre-badge"
                    style={{
                      backgroundColor: genreStyle.bg,
                      color: genreStyle.text,
                      borderColor: genreStyle.border
                    }}
                  >
                    {song.genre || "OTHER"}
                  </div>
                </div>

                <div className="song-card-stats">
                  <div className="stat-item">
                    <div className="stat-label">Rating</div>
                    <div className="stat-value">{formatRating(song.weightedRating)}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Votes</div>
                    <div className="stat-value">{song.ratingCount}</div>
                  </div>
                </div>

                <div className="top-song-footer">
                  <span className="muted">
                    {song.ratingCount === 0 ? "No ratings yet" : `${song.ratingCount} ratings`}
                  </span>
                  <button type="button" className="top-song-link" onClick={() => openSongDetail(song)}>
                    Details
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {selectedSong ? (
        <SongDetailModal
          song={selectedSong}
          isOpen={isSongModalOpen}
          onClose={closeSongDetail}
          onRate={handleModalRate}
        />
      ) : null}
    </div>
  );
}
