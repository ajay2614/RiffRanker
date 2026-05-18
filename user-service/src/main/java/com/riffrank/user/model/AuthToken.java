package com.riffrank.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_token")
public class AuthToken {
  @Id
  @Column(nullable = false, length = 64)
  private String token;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public AuthToken() {}

  public AuthToken(String token, UUID userId, Instant expiresAt, Instant createdAt) {
    this.token = token;
    this.userId = userId;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
  }

  public String getToken() { return token; }
  public void setToken(String token) { this.token = token; }
  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
