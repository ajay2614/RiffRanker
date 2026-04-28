export type Genre =
  | "ROCK"
  | "METAL"
  | "POP"
  | "JAZZ"
  | "HIPHOP"
  | "ELECTRONIC"
  | "CLASSICAL"
  | "COUNTRY"
  | "INDIE"
  | "OTHER";

export type SongDto = {
  id: string;
  title: string;
  genre: Genre;
  artistId: string | null;
  artistName: string;
  albumName: string | null;
  releaseYear: number | null;
  imageUrl: string | null;
  songUrl: string;
  ratingCount: number;
  actualRating: number | null;
  weightedRating: number | null;
};

export type ArtistDto = {
  id: string;
  name: string;
  imageUrl: string | null;
  biography: string | null;
  spotifyUrl: string | null;
  websiteUrl: string | null;
  createdAt: string;
};

export type ExternalSongResult = {
  id: string;
  title: string;
  artistName: string;
  albumName: string | null;
  genre: Genre;
  imageUrl: string | null;
  previewUrl: string | null;
};

export type ExternalSearchResult = {
  results: ExternalSongResult[];
};

export type ExternalArtist = {
  id: string;
  name: string;
  disambiguation: string | null;
  country: string | null;
  score: number;
  type: string | null;
  gender: string | null;
  beginDate: string | null;
  endDate: string | null;
  ended: boolean;
  wikipediaUrl: string | null;
};

export type ExternalArtistSearchResult = {
  count: number;
  offset: number;
  artists: ExternalArtist[];
};
