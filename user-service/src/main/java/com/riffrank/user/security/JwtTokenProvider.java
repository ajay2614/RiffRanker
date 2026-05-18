package com.riffrank.user.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {
  private static final String USER_ID_CLAIM = "userId";
  private static final String USERNAME_CLAIM = "username";
  
  @Value("${jwt.secret:riffrank-secret-key-change-in-production-minimum-32-chars}")
  private String jwtSecret;
  
  @Value("${jwt.expiration-ms:2592000000}")
  private long jwtExpirationMs;

  public String generateToken(UUID userId, String username) {
    Instant now = Instant.now();
    Instant expiryDate = now.plus(Duration.ofMillis(jwtExpirationMs));
    
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    
    return Jwts.builder()
        .subject(username)
        .claim(USER_ID_CLAIM, userId.toString())
        .claim(USERNAME_CLAIM, username)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiryDate))
        .signWith(key)
        .compact();
  }

  public String getUserIdFromToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Claims claims = (Claims) Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      return (String) claims.get(USER_ID_CLAIM);
    } catch (Exception e) {
      return null;
    }
  }

  public String getUsernameFromToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Claims claims = (Claims) Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      return (String) claims.get(USERNAME_CLAIM);
    } catch (Exception e) {
      return null;
    }
  }

  public boolean validateToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }
}
