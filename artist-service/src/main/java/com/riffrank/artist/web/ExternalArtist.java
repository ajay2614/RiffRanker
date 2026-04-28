package com.riffrank.artist.web;

import com.riffrank.artist.client.ITunesArtistClient;

public class ExternalArtist {
  private String id;
  private String name;
  private String disambiguation;
  private String country;
  private int score;
  private String type;
  private String gender;
  private String beginDate;
  private String endDate;
  private boolean ended;
  private String wikipediaUrl;

  public ExternalArtist() {}

  public ExternalArtist(String id, String name, String disambiguation, String country, int score, String type, String gender, String beginDate, String endDate, boolean ended, String wikipediaUrl) {
    this.id = id;
    this.name = name;
    this.disambiguation = disambiguation;
    this.country = country;
    this.score = score;
    this.type = type;
    this.gender = gender;
    this.beginDate = beginDate;
    this.endDate = endDate;
    this.ended = ended;
    this.wikipediaUrl = wikipediaUrl;
  }

  public static ExternalArtist fromITunes(ITunesArtistClient.ITunesArtist iTunesArtist) {
    return new ExternalArtist(
        String.valueOf(iTunesArtist.getArtistId()),
        iTunesArtist.getArtistName(),
        null,
        null,
        100,
        iTunesArtist.getPrimaryGenreName(),
        null,
        null,
        null,
        false,
        null);
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public String getDisambiguation() { return disambiguation; }
  public void setDisambiguation(String disambiguation) { this.disambiguation = disambiguation; }

  public String getCountry() { return country; }
  public void setCountry(String country) { this.country = country; }

  public int getScore() { return score; }
  public void setScore(int score) { this.score = score; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public String getGender() { return gender; }
  public void setGender(String gender) { this.gender = gender; }

  public String getBeginDate() { return beginDate; }
  public void setBeginDate(String beginDate) { this.beginDate = beginDate; }

  public String getEndDate() { return endDate; }
  public void setEndDate(String endDate) { this.endDate = endDate; }

  public boolean isEnded() { return ended; }
  public void setEnded(boolean ended) { this.ended = ended; }

  public String getWikipediaUrl() { return wikipediaUrl; }
  public void setWikipediaUrl(String wikipediaUrl) { this.wikipediaUrl = wikipediaUrl; }
}
