package com.riffrank.song.web;

import com.riffrank.song.client.ITunesSongClient;

public record ExternalTopResult(Type type, Song song, Artist artist) {
  public enum Type {
    SONG,
    ARTIST,
    UNKNOWN
  }

  public record Song(
      String id,
      String title,
      String artistName,
      String albumName,
      String imageUrl,
      String previewUrl
  ) {}

  public record Artist(
      String id,
      String name,
      String primaryGenre
  ) {}

  public static ExternalTopResult fromITunes(ITunesSongClient.ITunesAnyResult r) {
    if (r == null) {
      return new ExternalTopResult(Type.UNKNOWN, null, null);
    }

    // Song results typically have wrapperType=track and kind=song.
    if ("track".equalsIgnoreCase(r.getWrapperType()) && "song".equalsIgnoreCase(r.getKind())) {
      Song song =
          new Song(
              r.getTrackId() == null ? null : String.valueOf(r.getTrackId()),
              r.getTrackName(),
              r.getArtistName(),
              r.getCollectionName(),
              r.getArtworkUrl100(),
              r.getPreviewUrl());
      return new ExternalTopResult(Type.SONG, song, null);
    }

    // Artist results typically have wrapperType=artist.
    if ("artist".equalsIgnoreCase(r.getWrapperType())) {
      Artist artist =
          new Artist(
              r.getArtistId() == null ? null : String.valueOf(r.getArtistId()),
              r.getArtistName(),
              r.getPrimaryGenreName());
      return new ExternalTopResult(Type.ARTIST, null, artist);
    }

    return new ExternalTopResult(Type.UNKNOWN, null, null);
  }
}

