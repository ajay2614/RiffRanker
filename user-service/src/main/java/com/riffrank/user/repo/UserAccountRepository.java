package com.riffrank.user.repo;

import com.riffrank.user.model.UserAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
  Optional<UserAccount> findByUsernameIgnoreCase(String username);
  boolean existsByUsernameIgnoreCase(String username);
}

