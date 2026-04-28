package com.riffrank.artist.web;

public class UpdateArtistRequest {
  private String name;
  private String imageUrl;
  private String biography;
  private String spotifyUrl;
  private String websiteUrl;

  public UpdateArtistRequest() {}

  public String name() { return name; }
  public void setName(String name) { this.name = name; }

  public String imageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

  public String biography() { return biography; }
  public void setBiography(String biography) { this.biography = biography; }

  public String spotifyUrl() { return spotifyUrl; }
  public void setSpotifyUrl(String spotifyUrl) { this.spotifyUrl = spotifyUrl; }

  public String websiteUrl() { return websiteUrl; }
  public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
}
