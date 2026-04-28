package com.riffrank.song.web;

import com.riffrank.song.model.Genre;
import com.riffrank.song.model.Song;
import java.util.UUID;

public class SongDto {
  private final UUID id;
  private final String title;
  private final Genre genre;
  private final UUID artistId;
  private final String artistName;
  private final String albumName;
  private final Integer releaseYear;
  private final String imageUrl;
  private final String songUrl;
  private final long ratingCount;
  private final Double actualRating;
  private final Double weightedRating;

  public SongDto(UUID id, String title, Genre genre, UUID artistId, String artistName, String albumName, Integer releaseYear, String imageUrl, String songUrl, long ratingCount, Double actualRating, Double weightedRating) {
    this.id = id;
    this.title = title;
    this.genre = genre;
    this.artistId = artistId;
    this.artistName = artistName;
    this.albumName = albumName;
    this.releaseYear = releaseYear;
    this.imageUrl = imageUrl;
    this.songUrl = songUrl;
    this.ratingCount = ratingCount;
    this.actualRating = actualRating;
    this.weightedRating = weightedRating;
  }

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

  // Getters
  public UUID getId() { return id; }
  public String getTitle() { return title; }
  public Genre getGenre() { return genre; }
  public UUID getArtistId() { return artistId; }
  public String getArtistName() { return artistName; }
  public String getAlbumName() { return albumName; }
  public Integer getReleaseYear() { return releaseYear; }
  public String getImageUrl() { return imageUrl; }
  public String getSongUrl() { return songUrl; }
  public long getRatingCount() { return ratingCount; }
  public Double getActualRating() { return actualRating; }
  public Double getWeightedRating() { return weightedRating; }
}
