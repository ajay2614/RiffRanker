package com.riffrank.song.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class SongRatingKey implements Serializable {
  private UUID songId;
  private UUID userId;

  public SongRatingKey() {}

  public SongRatingKey(UUID songId, UUID userId) {
    this.songId = songId;
    this.userId = userId;
  }

  public UUID getSongId() { return songId; }
  public UUID getUserId() { return userId; }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    SongRatingKey that = (SongRatingKey) o;
    return Objects.equals(songId, that.songId) && Objects.equals(userId, that.userId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(songId, userId);
  }
}

