package com.riffrank.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_account")
public class UserAccount {
  @Id
  @Column(nullable = false)
  private UUID id;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "display_name", length = 40)
  private String displayName;

  @Lob
  @Column(name = "avatar_data", columnDefinition = "LONGTEXT")
  private String avatarData;

  @Column(name = "avatar_content_type", length = 50)
  private String avatarContentType;

  public UserAccount() {}

  public UserAccount(UUID id, String username, String passwordHash, Instant createdAt) {
    this.id = id;
    this.username = username;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
  }

  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public String getDisplayName() { return displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }
  public String getAvatarData() { return avatarData; }
  public void setAvatarData(String avatarData) { this.avatarData = avatarData; }
  public String getAvatarContentType() { return avatarContentType; }
  public void setAvatarContentType(String avatarContentType) { this.avatarContentType = avatarContentType; }
}

