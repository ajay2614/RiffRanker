import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ArtistDto, SongDto } from "../api/types";

export default function SongPage() {
  const { id } = useParams();
  const songId = id ?? "";
  const [song, setSong] = useState<SongDto | null>(null);
  const [artist, setArtist] = useState<ArtistDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState(10);
  const [rateBusy, setRateBusy] = useState(false);

  const canLoad = useMemo(() => songId.length > 0, [songId]);

  const load = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError(null);
    try {
      const s = await api.songs.get(songId);
      setSong(s);
      if (s.artistId) {
        try {
          const a = await api.artists.get(s.artistId);
          setArtist(a);
        } catch {
          setArtist(null);
        }
      } else {
        setArtist(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [canLoad, songId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!songId) return;
    setRateBusy(true);
    setError(null);
    try {
      await api.songs.rate(songId, rateValue);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes("401") ? "Please sign in to rate songs." : msg);
    } finally {
      setRateBusy(false);
    }
  }

  if (loading) return <div className="card muted">Loading…</div>;
  if (error) return <div className="card" style={{ color: "#ffb4b4" }}>{error}</div>;
  if (!song) return <div className="card muted">Song not found.</div>;

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        {song.imageUrl ? (
          <img
            src={song.imageUrl}
            alt="cover"
            width={180}
            height={180}
            style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
          />
        ) : null}

        <div style={{ minWidth: 280 }}>
          <div className="muted">
            <Link to={`/top/${song.genre}`}>{song.genre}</Link>
          </div>
          <h2 style={{ marginTop: 4, marginBottom: 6 }}>{song.title}</h2>
          <div className="muted">
            {song.artistName}
            {song.albumName ? ` • ${song.albumName}` : ""}
            {song.releaseYear ? ` • ${song.releaseYear}` : ""}
          </div>

          <div style={{ marginTop: 12 }}>
            <div>
              <strong>Actual:</strong> {song.actualRating == null ? "—" : song.actualRating.toFixed(1)}{" "}
              <span className="muted">({song.ratingCount} votes)</span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <a href={song.songUrl} target="_blank" rel="noreferrer">
              Open song ↗
            </a>
          </div>
        </div>
      </div>

      {artist ? (
        <div style={{ marginTop: 16 }} className="card">
          <div className="muted">Artist</div>
          <div className="row" style={{ alignItems: "center" }}>
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt="artist"
                width={64}
                height={64}
                style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
              />
            ) : null}
            <div>
              <div style={{ fontWeight: 700 }}>{artist.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {artist.id}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }} className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Rate this song</div>
        <form onSubmit={submitRating} className="row">
          <select value={rateValue} onChange={(e) => setRateValue(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <button className="primary" type="submit" disabled={rateBusy}>
            {rateBusy ? "Submitting…" : "Submit rating"}
          </button>
        </form>
      </div>
    </div>
  );
}
