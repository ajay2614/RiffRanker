import type { ArtistDto, Genre, SongDto } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function url(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const resp = await fetch(url(path), {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`${method} ${path} failed (${resp.status}): ${text || resp.statusText}`);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export const api = {
  songs: {
    search: (q: string) => request<SongDto[]>("GET", `/api/songs/search?q=${encodeURIComponent(q)}`),
    top: (genre: Genre) =>
      request<SongDto[]>("GET", `/api/songs/top?genre=${encodeURIComponent(genre)}`),
    get: (id: string) => request<SongDto>("GET", `/api/songs/${encodeURIComponent(id)}`),
    rate: (id: string, value: number) =>
      request<void>("POST", `/api/songs/${encodeURIComponent(id)}/ratings`, { value }),
    create: (
      adminKey: string,
      payload: {
        title: string;
        genre: Genre;
        artistId?: string | null;
        artistName: string;
        albumName?: string | null;
        releaseYear?: number | null;
        imageUrl?: string | null;
        songUrl: string;
      }
    ) =>
      request<SongDto>(
        "POST",
        "/api/songs",
        payload,
        adminKey ? { "X-ADMIN-KEY": adminKey } : {}
      ),
    update: (
      adminKey: string,
      id: string,
      payload: {
        title?: string;
        genre?: Genre;
        artistId?: string | null;
        artistName?: string;
        albumName?: string | null;
        releaseYear?: number | null;
        imageUrl?: string | null;
        songUrl?: string;
      }
    ) =>
      request<SongDto>(
        "PATCH",
        `/api/songs/${encodeURIComponent(id)}`,
        payload,
        adminKey ? { "X-ADMIN-KEY": adminKey } : {}
      )
  },
  artists: {
    get: (id: string) => request<ArtistDto>("GET", `/api/artists/${encodeURIComponent(id)}`),
    search: (name: string) =>
      request<ArtistDto[]>("GET", `/api/artists/search?name=${encodeURIComponent(name)}`),
    create: (
      adminKey: string,
      payload: {
        name: string;
        imageUrl?: string | null;
        biography?: string | null;
        spotifyUrl?: string | null;
        websiteUrl?: string | null;
      }
    ) =>
      request<ArtistDto>(
        "POST",
        "/api/artists",
        payload,
        adminKey ? { "X-ADMIN-KEY": adminKey } : {}
      ),
    update: (
      adminKey: string,
      id: string,
      payload: {
        name?: string;
        imageUrl?: string | null;
        biography?: string | null;
        spotifyUrl?: string | null;
        websiteUrl?: string | null;
      }
    ) =>
      request<ArtistDto>(
        "PATCH",
        `/api/artists/${encodeURIComponent(id)}`,
        payload,
        adminKey ? { "X-ADMIN-KEY": adminKey } : {}
      )
  }
};
