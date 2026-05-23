import type {
  ArtistDto,
  ExternalAlbumSearchResult,
  ExternalArtistSearchResult,
  ExternalSearchResult,
  ExternalTopResult,
  Genre,
  SongDto
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
export const AUTH_TOKEN_STORAGE = "riffrank_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE);
}

export function setAuthToken(token: string | null) {
  if (!token) localStorage.removeItem(AUTH_TOKEN_STORAGE);
  else localStorage.setItem(AUTH_TOKEN_STORAGE, token);
}

function url(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const token = getAuthToken();
  const resp = await fetch(url(path), {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  auth: {
    register: (username: string, password: string) =>
      request<{ id: string; username: string; createdAt: string }>("POST", "/api/users/register", {
        username,
        password
      }),
    login: (username: string, password: string) =>
      request<{ token: string }>("POST", "/api/users/login", { username, password })
  },
  songs: {
    search: (q: string) => request<SongDto[]>("GET", `/api/songs/search?q=${encodeURIComponent(q)}`),
    searchExternal: (q: string, limit: number = 10, offset: number = 0) =>
      request<ExternalSearchResult>("GET", `/api/songs/search/itunes?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`),
    searchExternalAlbums: (q: string, limit: number = 10) =>
      request<ExternalAlbumSearchResult>("GET", `/api/songs/search/itunes/albums?q=${encodeURIComponent(q)}&limit=${limit}`),
    searchExternalTop: (q: string) =>
      request<ExternalTopResult>("GET", `/api/songs/search/itunes/top?q=${encodeURIComponent(q)}`),
    top: () => request<SongDto[]>("GET", `/api/songs/top`),
    get: (id: string) => request<SongDto>("GET", `/api/songs/${encodeURIComponent(id)}`),
    rate: (id: string, value: number, songDetails?: {
      title?: string;
      genre?: Genre;
      artistId?: string | null;
      artistName?: string;
      albumName?: string | null;
      releaseYear?: number | null;
      imageUrl?: string | null;
      songUrl?: string;
    }) =>
      request<void>("POST", `/api/songs/${encodeURIComponent(id)}/ratings`, { 
        value,
        ...songDetails
      }),
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
    searchExternal: (q: string, limit: number = 10, offset: number = 0) =>
      request<ExternalArtistSearchResult>("GET", `/api/artists/search/itunes?q=${encodeURIComponent(q)}&limit=${limit}`),
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
