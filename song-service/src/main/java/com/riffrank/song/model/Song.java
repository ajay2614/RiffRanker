package com.riffrank.song.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "song")
public class Song {
  @Id
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "external_id", unique = true)
  private String externalId;

  @Column(name = "title", nullable = false)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(name = "genre", nullable = false)
  private Genre genre;

  @Column(name = "artist_id")
  private UUID artistId;

  @Column(name = "artist_name", nullable = false)
  private String artistName;

  @Column(name = "album_name")
  private String albumName;

  @Column(name = "release_year")
  private Integer releaseYear;

  @Column(name = "image_url")
  private String imageUrl;

  @Column(name = "song_url", nullable = false)
  private String songUrl;

  @Column(name = "rating_sum", nullable = false)
  private long ratingSum;

  @Column(name = "rating_count", nullable = false)
  private long ratingCount;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected Song() {}

  public Song(
      UUID id,
      String externalId,
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
      Instant createdAt) {
    this.id = id;
    this.externalId = externalId;
    this.title = title;
    this.genre = genre;
    this.artistId = artistId;
    this.artistName = artistName;
    this.albumName = albumName;
    this.releaseYear = releaseYear;
    this.imageUrl = imageUrl;
    this.songUrl = songUrl;
    this.ratingSum = ratingSum;
    this.ratingCount = ratingCount;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public String getExternalId() {
    return externalId;
  }

  public void setExternalId(String externalId) {
    this.externalId = externalId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Genre getGenre() {
    return genre;
  }

  public void setGenre(Genre genre) {
    this.genre = genre;
  }

  public UUID getArtistId() {
    return artistId;
  }

  public void setArtistId(UUID artistId) {
    this.artistId = artistId;
  }

  public String getArtistName() {
    return artistName;
  }

  public void setArtistName(String artistName) {
    this.artistName = artistName;
  }

  public String getAlbumName() {
    return albumName;
  }

  public void setAlbumName(String albumName) {
    this.albumName = albumName;
  }

  public Integer getReleaseYear() {
    return releaseYear;
  }

  public void setReleaseYear(Integer releaseYear) {
    this.releaseYear = releaseYear;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public String getSongUrl() {
    return songUrl;
  }

  public void setSongUrl(String songUrl) {
    this.songUrl = songUrl;
  }

  public long getRatingSum() {
    return ratingSum;
  }

  public long getRatingCount() {
    return ratingCount;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
