package com.riffrank.song.web;

import com.riffrank.song.client.ITunesSongClient;
import java.util.ArrayList;
import java.util.List;

public class ExternalSearchResult {
  public List<ExternalSongResult> results;

  public ExternalSearchResult(List<ExternalSongResult> results) {
    this.results = results;
  }

  public List<ExternalSongResult> getResults() {
    return results;
  }

  public static ExternalSearchResult fromITunes(ITunesSongClient.ITunesSearchResult iTunesResult) {
    List<ExternalSongResult> results = new ArrayList<>();

    if (iTunesResult.getResults() != null) {
      for (ITunesSongClient.ITunesSong song : iTunesResult.getResults()) {
        results.add(new ExternalSongResult(
            String.valueOf(song.getTrackId()),
            song.getTrackName(),
            song.getArtistName(),
            song.getCollectionName(),
            "ROCK", // Default genre, can be improved
            song.getArtworkUrl100(),
            song.getPreviewUrl()
        ));
      }
    }

    return new ExternalSearchResult(results);
  }

  public static class ExternalSongResult {
    public String id;
    public String title;
    public String artistName;
    public String albumName;
    public String genre;
    public String imageUrl;
    public String previewUrl;

    public ExternalSongResult(String id, String title, String artistName, String albumName, String genre, String imageUrl, String previewUrl) {
      this.id = id;
      this.title = title;
      this.artistName = artistName;
      this.albumName = albumName;
      this.genre = genre;
      this.imageUrl = imageUrl;
      this.previewUrl = previewUrl;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getArtistName() { return artistName; }
    public String getAlbumName() { return albumName; }
    public String getGenre() { return genre; }
    public String getImageUrl() { return imageUrl; }
    public String getPreviewUrl() { return previewUrl; }
  }
}
