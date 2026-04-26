package com.riffrank.artist.repo;

import com.riffrank.artist.model.Artist;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtistRepository extends JpaRepository<Artist, UUID> {
  List<Artist> findTop25ByNameContainingIgnoreCaseOrderByNameAsc(String name);
}

