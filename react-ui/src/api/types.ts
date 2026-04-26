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
