package com.riffrank.song.service;

import com.riffrank.song.model.Genre;
import com.riffrank.song.repo.SongRepository;
import com.riffrank.song.web.SongDto;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SongRankingService {
  private final SongRepository songRepository;
  private final double minimumVotes;

  public SongRankingService(
      SongRepository songRepository,
      @Value("${riffrank.rating.minimum-votes:1}") double minimumVotes) {
    this.songRepository = songRepository;
    this.minimumVotes = minimumVotes;
  }

  public List<SongDto> top100(Genre genre) {
    // Genre-based Top 100 is disabled for now; return global Top 100.
    return top100All();
  }

  public List<SongDto> top100All() {
    Double avg = songRepository.globalAverageActualRating();
    double c = avg == null ? 0.0 : avg;
    return songRepository.top100Weighted(c, minimumVotes).stream()
        .map(
            row ->
                SongDto.fromTopRow(
                    UUID.fromString(row.getId()),
                    row.getTitle(),
                    Genre.valueOf(row.getGenre()),
                    row.getArtistId() == null ? null : UUID.fromString(row.getArtistId()),
                    row.getArtistName(),
                    row.getAlbumName(),
                    row.getReleaseYear(),
                    row.getImageUrl(),
                    row.getSongUrl(),
                    row.getRatingSum(),
                    row.getRatingCount(),
                    row.getWeightedRating()))
        .toList();
  }
}
