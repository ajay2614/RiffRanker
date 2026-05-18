package com.riffrank.song.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {
  private static final String USER_ID_CLAIM = "userId";
  private static final String USERNAME_CLAIM = "username";
  
  @Value("${jwt.secret:riffrank-secret-key-change-in-production-minimum-32-chars}")
  private String jwtSecret;

  public String getUserIdFromToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      return (String) claims.get(USER_ID_CLAIM);
    } catch (Exception e) {
      return null;
    }
  }

  public String getUsernameFromToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
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
