package com.riffrank.song.web;

import com.riffrank.song.client.ITunesSongClient;
import java.util.ArrayList;
import java.util.List;

public record ExternalAlbumSearchResult(List<ExternalAlbumResult> results) {
  public static ExternalAlbumSearchResult fromITunes(ITunesSongClient.ITunesAlbumSearchResult iTunesResult) {
    List<ExternalAlbumResult> results = new ArrayList<>();
    if (iTunesResult != null && iTunesResult.getResults() != null) {
      for (ITunesSongClient.ITunesAlbum a : iTunesResult.getResults()) {
        results.add(
            new ExternalAlbumResult(
                String.valueOf(a.getCollectionId()),
                a.getCollectionName(),
                a.getArtistName(),
                a.getArtworkUrl100(),
                a.getCollectionViewUrl()));
      }
    }
    return new ExternalAlbumSearchResult(results);
  }

  public record ExternalAlbumResult(
      String id,
      String title,
      String artistName,
      String imageUrl,
      String albumUrl
  ) {}
}

