package com.riffrank.webui.model;

import java.util.UUID;

public class ArtistDto {
  private UUID id;
  private String name;
  private String imageUrl;
  private String biography;
  private String spotifyUrl;
  private String websiteUrl;
  private java.time.Instant createdAt;

  public ArtistDto() {}

  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getImageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public String getBiography() { return biography; }
  public void setBiography(String biography) { this.biography = biography; }
  public String getSpotifyUrl() { return spotifyUrl; }
  public void setSpotifyUrl(String spotifyUrl) { this.spotifyUrl = spotifyUrl; }
  public String getWebsiteUrl() { return websiteUrl; }
  public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
  public java.time.Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(java.time.Instant createdAt) { this.createdAt = createdAt; }
}
