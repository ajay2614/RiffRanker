import { useEffect, useMemo, useState } from "react";
import type { ExternalSongResult, SongDto } from "../api/types";
import { api } from "../api/client";

interface SongDetailModalProps {
  song: ExternalSongResult;
  isOpen: boolean;
  onClose: () => void;
  onRate: (rating: number) => Promise<void>;
}

function getLargeArtworkUrl(imageUrl: string | null) {
  return imageUrl?.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, "/600x600bb.$1") ?? null;
}

function getItunesSearchUrl(title: string, artistName: string) {
  return `https://music.apple.com/search?term=${encodeURIComponent(title)} ${encodeURIComponent(artistName)}`;
}

function getFallbackMonogram(title: string, artistName: string) {
  const seed = (artistName || title)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return seed || "RR";
}

export function SongDetailModal({ song, isOpen, onClose, onRate }: SongDetailModalProps) {
  const [topRank, setTopRank] = useState<number | null>(null);
  const [isInTop100, setIsInTop100] = useState(false);
  const [loading, setLoading] = useState(false);
  const [songData, setSongData] = useState<SongDto | null>(null);
  const [rating, setRating] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);

  const artworkUrl = useMemo(() => getLargeArtworkUrl(song.imageUrl), [song.imageUrl]);
  const itunesUrl = useMemo(() => getItunesSearchUrl(song.title, song.artistName), [song.artistName, song.title]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setTopRank(null);
    setIsInTop100(false);
    setSongData(null);
    setRating("");
    setRatingError(null);
    setMyRating(null);

    Promise.all([
      api.songs.get(song.id).catch(() => null),
      api.songs.top().catch(() => []),
      api.songs.myRating(song.id).then((r) => r.value).catch(() => null)
    ])
      .then(([songInfo, topSongs, mine]) => {
        if (songInfo) setSongData(songInfo);
        setMyRating(mine);

        const rank = topSongs.findIndex((s) => s.id === song.id);
        if (rank !== -1) {
          setTopRank(rank + 1);
          setIsInTop100(true);
        }
      })
      .catch(() => {
        // Best effort only.
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, song.id]);

  const handleRate = async (nextRating: string) => {
    if (!nextRating) return;

    setRatingLoading(true);
    setRatingError(null);

    try {
      const ratingNum = parseInt(nextRating);
      await onRate(ratingNum);
      const updated = await api.songs.get(song.id).catch(() => null);
      if (updated) {
        setSongData(updated);
      }
      setMyRating(ratingNum);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Failed to rate song");
    } finally {
      setRatingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="song-detail-overlay" onClick={onClose}>
      <div className="song-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="song-detail-close" onClick={onClose} aria-label="Close dialog">
          ✕
        </button>

        <div className="song-detail-hero">
          <div className="song-detail-art-wrap">
            {artworkUrl ? (
              <img className="song-detail-art" src={artworkUrl} alt={song.title} />
            ) : (
              <div className="song-detail-art song-detail-art-fallback" aria-hidden="true">
                {getFallbackMonogram(song.title, song.artistName)}
              </div>
            )}

            {isInTop100 ? <div className="song-detail-rank-badge">Top #{topRank}</div> : null}
          </div>

          <div className="song-detail-copy">
            <div className="song-detail-kicker">Featured track</div>
            <h2 className="song-title">{song.title}</h2>
            <div className="song-detail-artist">{song.artistName}</div>

            <div className="song-detail-meta-row">
              {song.albumName ? <span className="song-detail-chip">{song.albumName}</span> : null}
              {song.genre ? <span className="song-detail-chip">{song.genre}</span> : null}
            </div>

            <div className="song-detail-action-row">
              <a
                href={itunesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button itunes-link song-detail-primary-action"
              >
                Open in iTunes
              </a>
            </div>

            {song.previewUrl ? (
              <div className="song-detail-preview">
                <div className="song-detail-preview-label">Preview</div>
                <audio controls className="audio-player">
                  <source src={song.previewUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : null}
          </div>
        </div>

        <div className="song-detail-grid">
          <section className="song-detail-panel">
            <div className="song-detail-panel-label">Rating</div>
            {loading ? (
              <div className="muted">Loading rating data…</div>
            ) : songData && songData.ratingCount > 0 ? (
              <div className="song-detail-rating-row">
                <div className="song-detail-rating-value">{songData.actualRating?.toFixed(1) ?? "N/A"}/10</div>
                <div className="song-detail-rating-meta">
                  {songData.ratingCount} {songData.ratingCount === 1 ? "vote" : "votes"}
                </div>
              </div>
            ) : (
              <div className="muted">Be the first to rate it.</div>
            )}
          </section>

          <section className="song-detail-panel">
            <div className="song-detail-panel-label">{myRating == null ? "Rate this song" : "Update your rating"}</div>
            {myRating != null ? <div className="song-detail-saved">Saved: {myRating}/10</div> : null}
            <div className="rating-row">
              <select
                id="rate-select"
                value={rating}
                onChange={(e) => {
                  const nextRating = e.target.value;
                  setRating(nextRating);
                  void handleRate(nextRating);
                }}
                disabled={ratingLoading}
                className="rating-select"
              >
                <option value="">{ratingLoading ? "Saving..." : "Choose"}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num}/10
                  </option>
                ))}
              </select>
            </div>
            {ratingError ? <div className="error-message">{ratingError}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
