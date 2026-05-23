import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { SongDto } from "../api/types";

export default function TopPage() {
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.songs
      .top()
      .then((data) => {
        if (!cancelled) setSongs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Top 100</h2>
          <div className="muted">Sorted by weighted rating</div>
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: 14 }} className="muted">
          Loading…
        </div>
      ) : error ? (
        <div style={{ marginTop: 14, color: "#ffb4b4" }}>{error}</div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Song</th>
                <th>Artist</th>
                <th>Weighted</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {songs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No songs yet.
                  </td>
                </tr>
              ) : (
                songs.map((s, idx) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <Link to={`/song/${s.id}`}>{s.title}</Link>
                    </td>
                    <td>{s.artistName}</td>
                    <td>{s.weightedRating == null ? "—" : s.weightedRating.toFixed(1)}</td>
                    <td>{s.ratingCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
