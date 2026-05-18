package com.riffrank.song.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "song_rating")
@IdClass(SongRatingKey.class)
public class SongRating {
  @Id
  @Column(name = "song_id", nullable = false)
  private UUID songId;

  @Id
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "rating_value", nullable = false)
  private int value;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public SongRating() {}

  public SongRating(UUID songId, UUID userId, int value, Instant createdAt, Instant updatedAt) {
    this.songId = songId;
    this.userId = userId;
    this.value = value;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getSongId() { return songId; }
  public void setSongId(UUID songId) { this.songId = songId; }
  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }
  public int getValue() { return value; }
  public void setValue(int value) { this.value = value; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
