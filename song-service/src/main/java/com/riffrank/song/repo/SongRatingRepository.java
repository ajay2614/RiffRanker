package com.riffrank.song.repo;

import com.riffrank.song.model.SongRating;
import com.riffrank.song.model.SongRatingKey;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SongRatingRepository extends JpaRepository<SongRating, SongRatingKey> {
  Optional<SongRating> findBySongIdAndUserId(UUID songId, UUID userId);

  void deleteBySongId(UUID songId);
}
