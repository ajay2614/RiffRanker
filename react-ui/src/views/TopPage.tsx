import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Genre, SongDto } from "../api/types";

const GENRES: Genre[] = [
  "ROCK",
  "METAL",
  "POP",
  "JAZZ",
  "HIPHOP",
  "ELECTRONIC",
  "CLASSICAL",
  "COUNTRY",
  "INDIE",
  "OTHER"
];

function isGenre(value: string | undefined): value is Genre {
  return value != null && (GENRES as string[]).includes(value);
}

export default function TopPage() {
  const { genre } = useParams();
  const selectedGenre: Genre = isGenre(genre) ? genre : "ROCK";
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const genreTabs = useMemo(() => GENRES, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.songs
      .top(selectedGenre)
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
  }, [selectedGenre]);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Top 100 {selectedGenre}</h2>
          <div className="muted">Sorted by weighted rating</div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        {genreTabs.map((g) => (
          <Link key={g} className={g === selectedGenre ? "pill" : "pill muted"} to={`/top/${g}`}>
            {g}
          </Link>
        ))}
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
                    No songs yet for this genre.
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
