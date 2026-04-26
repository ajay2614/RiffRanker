package com.riffrank.artist.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "artist")
public class Artist {
  @Id
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "image_url")
  private String imageUrl;

  @Column(name = "biography", columnDefinition = "text")
  private String biography;

  @Column(name = "spotify_url")
  private String spotifyUrl;

  @Column(name = "website_url")
  private String websiteUrl;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected Artist() {}

  public Artist(
      UUID id,
      String name,
      String imageUrl,
      String biography,
      String spotifyUrl,
      String websiteUrl,
      Instant createdAt) {
    this.id = id;
    this.name = name;
    this.imageUrl = imageUrl;
    this.biography = biography;
    this.spotifyUrl = spotifyUrl;
    this.websiteUrl = websiteUrl;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public String getBiography() {
    return biography;
  }

  public void setBiography(String biography) {
    this.biography = biography;
  }

  public String getSpotifyUrl() {
    return spotifyUrl;
  }

  public void setSpotifyUrl(String spotifyUrl) {
    this.spotifyUrl = spotifyUrl;
  }

  public String getWebsiteUrl() {
    return websiteUrl;
  }

  public void setWebsiteUrl(String websiteUrl) {
    this.websiteUrl = websiteUrl;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
