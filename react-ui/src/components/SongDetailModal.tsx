import { useEffect, useState } from "react";
import type { ExternalSongResult, SongDto } from "../api/types";
import { api } from "../api/client";

interface SongDetailModalProps {
  song: ExternalSongResult;
  isOpen: boolean;
  onClose: () => void;
  onRate: (rating: number) => Promise<void>;
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

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setTopRank(null);
    setIsInTop100(false);
    setSongData(null);
    setRating("");
    setRatingError(null);
    setMyRating(null);

    // Fetch song data from backend to get current ratings
    Promise.all([
      api.songs.get(song.id).catch(() => null),
      api.songs.top().catch(() => []),
      api.songs.myRating(song.id).then(r => r.value).catch(() => null)
    ])
      .then(([songInfo, topSongs, mine]) => {
        if (songInfo) {
          setSongData(songInfo);
        }
        setMyRating(mine);
        
        const rank = topSongs.findIndex((s) => s.id === song.id);
        if (rank !== -1) {
          setTopRank(rank + 1);
          setIsInTop100(true);
        }
      })
      .catch(() => {
        // Silent fail - if fetch fails, just show without data
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
      // Refresh song data after rating
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="song-detail-container">
          {/* Song Details */}
          <div className="song-info-section">
            {isInTop100 && (
              <div className="top-100-badge top-100-badge-inline">Top #{topRank}</div>
            )}
            <h2 className="song-title">{song.title}</h2>

            <div className="song-meta">
              <div className="meta-item">
                <span className="meta-label">Artist</span>
                <span className="meta-value">{song.artistName}</span>
              </div>

              {song.albumName && (
                <div className="meta-item">
                  <span className="meta-label">Album</span>
                  <span className="meta-value">{song.albumName}</span>
                </div>
              )}

              {song.genre && (
                <div className="meta-item">
                  <span className="meta-label">Genre</span>
                  <span className="meta-value">{song.genre}</span>
                </div>
              )}
            </div>

            {/* Preview Player */}
            {song.previewUrl && (
              <div className="preview-section">
                <label>Preview</label>
                <audio controls className="audio-player">
                  <source src={song.previewUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Rating Stats and Form */}
            <div className="rating-section">
              {myRating != null ? (
                <div className="rating-stats" style={{ marginBottom: 10 }}>
                  <label>You already rated this</label>
                  <div className="rating-display">
                    <span className="rating-value">{myRating}/10</span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      (you can update it below)
                    </span>
                  </div>
                </div>
              ) : null}
              {songData && songData.ratingCount > 0 ? (
                <div className="rating-stats">
                  <label>Community Rating</label>
                  <div className="rating-display">
                    <span className="rating-value">
                      {songData.actualRating?.toFixed(1) || "N/A"}/10
                    </span>
                    <span className="rating-count">
                      ({songData.ratingCount} {songData.ratingCount === 1 ? "rating" : "ratings"})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rating-stats">
                  <label>No ratings yet</label>
                  <p className="no-ratings-text">Be the first to rate this song!</p>
                </div>
              )}

              <div className="rating-form">
                <label htmlFor="rate-select">
                  {myRating == null ? "Rate this song" : `You rated this ${myRating}/10`}
                </label>
                <div className="rating-row">
                  <select
                    id="rate-select"
                    value={rating}
                    onChange={(e) => {
                      const nextRating = e.target.value;
                      setRating(nextRating);
                      handleRate(nextRating);
                    }}
                    disabled={ratingLoading}
                    className="rating-select"
                  >
                    <option value="">{ratingLoading ? "Saving..." : "Rate"}</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}/10
                      </option>
                    ))}
                  </select>
                </div>
                {ratingError && <div className="error-message">{ratingError}</div>}
              </div>
            </div>

            {/* iTunes Link */}
            <div className="external-links">
              <a
                href={`https://music.apple.com/search?term=${encodeURIComponent(song.title)} ${encodeURIComponent(song.artistName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button itunes-link"
              >
                Open in iTunes
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.74);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.42);
          max-width: 560px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          z-index: 1001;
          padding: 4px 8px;
          color: rgba(245, 245, 245, 0.72);
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #fff;
        }

        .song-detail-container {
          padding: 24px;
          display: block;
          gap: 20px;
          align-items: start;
        }

        .top-100-badge {
          background: #f5f5f5;
          color: #141416;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .top-100-badge-inline {
          display: inline-block;
          margin-bottom: 10px;
        }

        .song-info-section {
          flex: 1;
        }

        .song-title {
          margin: 0 0 12px 0;
          font-size: 24px;
          color: #f5f5f5;
          padding-right: 36px;
        }

        .song-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta-label {
          font-size: 12px;
          text-transform: uppercase;
          color: rgba(245, 245, 245, 0.62);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .meta-value {
          color: #f5f5f5;
          font-weight: 500;
          text-align: right;
          flex: 1;
          margin-left: 12px;
          word-break: break-word;
        }

        .preview-section {
          margin: 16px 0;
          padding: 12px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }

        .preview-section label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #f5f5f5;
        }

        .audio-player {
          width: 100%;
          border-radius: 4px;
        }

        .rating-section {
          margin: 16px 0;
          padding: 12px;
          background: rgba(122, 162, 255, 0.12);
          border-radius: 8px;
          border: 1px solid rgba(122, 162, 255, 0.28);
        }

        .rating-section label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          color: #f5f5f5;
        }

        .rating-stats {
          margin-bottom: 12px;
        }

        .rating-display {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 8px;
        }

        .rating-value {
          font-size: 32px;
          font-weight: 700;
          color: #cfe0ff;
        }

        .rating-count {
          font-size: 14px;
          color: rgba(245, 245, 245, 0.62);
          font-weight: 500;
        }

        .no-ratings-text {
          margin: 6px 0 0 0;
          font-size: 14px;
          color: rgba(245, 245, 245, 0.62);
          font-style: italic;
        }

        .rate-button {
          width: 100%;
          padding: 10px 16px;
          margin-top: 8px;
          background: rgba(255, 255, 255, 0.16);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          font-size: 14px;
        }

        .rate-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(122, 162, 255, 0.28);
        }

        .rating-form {
          margin-top: 12px;
        }

        .rating-form label {
          font-size: 14px;
          margin-bottom: 8px;
        }

        .rating-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .rating-select {
          flex: 1;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.35);
          color: #f5f5f5;
          font-size: 14px;
        }

        .rating-select:disabled {
          background: rgba(255, 255, 255, 0.08);
          cursor: not-allowed;
        }

        .rating-row button {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .rating-row button.primary {
          background: rgba(255, 255, 255, 0.16);
          color: white;
        }

        .rating-row button.primary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        .rating-row button.primary:disabled {
          background: rgba(255, 255, 255, 0.08);
          cursor: not-allowed;
        }

        .rating-row button.secondary {
          background: rgba(255, 255, 255, 0.10);
          color: #f5f5f5;
        }

        .rating-row button.secondary:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        .error-message {
          color: #ffb4b4;
          font-size: 13px;
          margin-top: 6px;
        }

        .external-links {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .itunes-link {
          flex: 1;
          padding: 10px 16px;
          text-align: center;
          text-decoration: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          font-size: 14px;
        }

        .itunes-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 720px) {
          .modal-content {
            max-width: 95%;
            max-height: 95vh;
          }

          .song-detail-container {
            padding: 16px;
            gap: 16px;
          }

          .song-title {
            font-size: 20px;
          }

          .meta-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .meta-value {
            text-align: left;
            margin-left: 0;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
