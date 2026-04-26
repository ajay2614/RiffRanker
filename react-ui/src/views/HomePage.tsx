import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { SongDto } from "../api/types";

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SongDto[]>([]);

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    setParams(trimmed ? { q: trimmed } : {});
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.songs.search(trimmed);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Search</h2>
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
        Examples: Metallica, Enter Sandman, Nirvana
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: "#ffb4b4" }}>{error}</div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 10 }}>Results</h3>
          <table>
            <thead>
              <tr>
                <th>Song</th>
                <th>Artist</th>
                <th>Genre</th>
                <th>Actual rating</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No results yet.
                  </td>
                </tr>
              ) : (
                results.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/song/${s.id}`}>{s.title}</Link>
                    </td>
                    <td>{s.artistName}</td>
                    <td>{s.genre}</td>
                    <td>{s.actualRating == null ? "—" : s.actualRating.toFixed(1)}</td>
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
