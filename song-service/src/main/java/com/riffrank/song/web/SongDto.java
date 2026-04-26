package com.riffrank.song.web;

import com.riffrank.song.model.Genre;
import com.riffrank.song.model.Song;
import java.util.UUID;

public record SongDto(
    UUID id,
    String title,
    Genre genre,
    UUID artistId,
    String artistName,
    String albumName,
    Integer releaseYear,
    String imageUrl,
    String songUrl,
    long ratingCount,
    Double actualRating,
    Double weightedRating) {
  public static SongDto from(Song song, Double weightedRating) {
    Double actual =
        song.getRatingCount() == 0 ? null : (song.getRatingSum() * 1.0d) / song.getRatingCount();
    return new SongDto(
        song.getId(),
        song.getTitle(),
        song.getGenre(),
        song.getArtistId(),
        song.getArtistName(),
        song.getAlbumName(),
        song.getReleaseYear(),
        song.getImageUrl(),
        song.getSongUrl(),
        song.getRatingCount(),
        actual,
        weightedRating);
  }

  public static SongDto fromTopRow(
      UUID id,
      String title,
      Genre genre,
      UUID artistId,
      String artistName,
      String albumName,
      Integer releaseYear,
      String imageUrl,
      String songUrl,
      long ratingSum,
      long ratingCount,
      double weightedRating) {
    Double actual = ratingCount == 0 ? null : (ratingSum * 1.0d) / ratingCount;
    return new SongDto(
        id,
        title,
        genre,
        artistId,
        artistName,
        albumName,
        releaseYear,
        imageUrl,
        songUrl,
        ratingCount,
        actual,
        weightedRating);
  }
}
