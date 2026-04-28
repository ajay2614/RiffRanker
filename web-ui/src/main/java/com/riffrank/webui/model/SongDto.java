package com.riffrank.webui.model;

import java.util.UUID;

public class SongDto {
  private UUID id;
  private String title;
  private Genre genre;
  private UUID artistId;
  private String artistName;
  private String albumName;
  private Integer releaseYear;
  private String imageUrl;
  private String songUrl;
  private long ratingCount;
  private Double actualRating;
  private Double weightedRating;

  public SongDto() {}

  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public Genre getGenre() { return genre; }
  public void setGenre(Genre genre) { this.genre = genre; }
  public UUID getArtistId() { return artistId; }
  public void setArtistId(UUID artistId) { this.artistId = artistId; }
  public String getArtistName() { return artistName; }
  public void setArtistName(String artistName) { this.artistName = artistName; }
  public String getAlbumName() { return albumName; }
  public void setAlbumName(String albumName) { this.albumName = albumName; }
  public Integer getReleaseYear() { return releaseYear; }
  public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }
  public String getImageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public String getSongUrl() { return songUrl; }
  public void setSongUrl(String songUrl) { this.songUrl = songUrl; }
  public long getRatingCount() { return ratingCount; }
  public void setRatingCount(long ratingCount) { this.ratingCount = ratingCount; }
  public Double getActualRating() { return actualRating; }
  public void setActualRating(Double actualRating) { this.actualRating = actualRating; }
  public Double getWeightedRating() { return weightedRating; }
  public void setWeightedRating(Double weightedRating) { this.weightedRating = weightedRating; }
}
