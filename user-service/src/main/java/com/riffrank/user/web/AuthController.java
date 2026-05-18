package com.riffrank.user.web;

import com.riffrank.user.model.AuthToken;
import com.riffrank.user.model.UserAccount;
import com.riffrank.user.repo.AuthTokenRepository;
import com.riffrank.user.repo.UserAccountRepository;
import com.riffrank.user.security.JwtTokenProvider;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class AuthController {
  private static final Duration TOKEN_TTL = Duration.ofDays(30);
  private final UserAccountRepository users;
  private final AuthTokenRepository tokens;
  private final JwtTokenProvider jwtTokenProvider;
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthController(UserAccountRepository users, AuthTokenRepository tokens, JwtTokenProvider jwtTokenProvider) {
    this.users = users;
    this.tokens = tokens;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @PostMapping("/users/register")
  @ResponseStatus(HttpStatus.CREATED)
  public UserDto register(@RequestBody RegisterRequest request) {
    if (request.username() == null || request.username().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
    }
    if (request.password() == null || request.password().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
    }
    String username = request.username().trim();
    if (username.length() < 3 || username.length() > 32) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username must be 3-32 chars");
    }
    if (users.existsByUsernameIgnoreCase(username)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "username already taken");
    }

    Instant now = Instant.now();
    UserAccount created =
        users.save(new UserAccount(UUID.randomUUID(), username, passwordEncoder.encode(request.password()), now));
    return new UserDto(created.getId(), created.getUsername(), created.getCreatedAt());
  }

  @PostMapping("/users/login")
  public LoginResponse login(@RequestBody LoginRequest request) {
    if (request.username() == null || request.username().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
    }
    if (request.password() == null || request.password().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
    }

    UserAccount user =
        users
            .findByUsernameIgnoreCase(request.username().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
    }

    String jwtToken = jwtTokenProvider.generateToken(user.getId(), user.getUsername());
    
    // Save token to database for validation
    Instant now = Instant.now();
    Instant expiresAt = now.plus(TOKEN_TTL);
    AuthToken token = new AuthToken(sha256Hex(jwtToken), user.getId(), expiresAt, now);
    tokens.save(token);
    
    return new LoginResponse(jwtToken, user.getId().toString());
  }

  @PostMapping("/tokens/validate")
  public ValidateTokenResponse validate(@RequestBody ValidateTokenRequest request) {
    if (request.token() == null || request.token().isBlank()) {
      return new ValidateTokenResponse(false, null, null);
    }
    Instant now = Instant.now();
    return tokens
        .findByTokenAndExpiresAtAfter(sha256Hex(request.token().trim()), now)
        .map(
            t -> {
              UserAccount user =
                  users
                      .findById(t.getUserId())
                      .orElse(null);
              if (user == null) {
                return new ValidateTokenResponse(false, null, null);
              }
              return new ValidateTokenResponse(true, user.getId(), user.getUsername());
            })
        .orElseGet(() -> new ValidateTokenResponse(false, null, null));
  }

  public record RegisterRequest(String username, String password) {}

  public record LoginRequest(String username, String password) {}

  public record LoginResponse(String token, String userId) {}

  public record UserDto(UUID id, String username, Instant createdAt) {}

  public record ValidateTokenRequest(String token) {}

  public record ValidateTokenResponse(boolean valid, UUID userId, String username) {}

  private static String sha256Hex(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(bytes);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 not available", e);
    }
  }
}
