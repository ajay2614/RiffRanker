package com.riffrank.user.repo;

import com.riffrank.user.model.AuthToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
  Optional<AuthToken> findByTokenAndExpiresAtAfter(String token, Instant now);
}

