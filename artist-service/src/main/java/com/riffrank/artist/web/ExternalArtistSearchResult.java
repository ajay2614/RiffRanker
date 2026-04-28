package com.riffrank.artist.web;

import com.riffrank.artist.client.ITunesArtistClient;
import java.util.List;

public class ExternalArtistSearchResult {
  private int count;
  private int offset;
  private List<ExternalArtist> artists;

  public ExternalArtistSearchResult() {}

  public ExternalArtistSearchResult(int count, int offset, List<ExternalArtist> artists) {
    this.count = count;
    this.offset = offset;
    this.artists = artists;
  }

  public static ExternalArtistSearchResult fromITunes(ITunesArtistClient.ITunesArtistSearchResult iTunesResult) {
    List<ExternalArtist> artists = iTunesResult.getResults().stream()
        .map(ExternalArtist::fromITunes)
        .toList();
    return new ExternalArtistSearchResult(iTunesResult.getResultCount(), 0, artists);
  }

  public int getCount() { return count; }
  public void setCount(int count) { this.count = count; }

  public int getOffset() { return offset; }
  public void setOffset(int offset) { this.offset = offset; }

  public List<ExternalArtist> getArtists() { return artists; }
  public void setArtists(List<ExternalArtist> artists) { this.artists = artists; }
}
