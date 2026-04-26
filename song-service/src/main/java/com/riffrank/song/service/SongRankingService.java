package com.riffrank.song.service;

import com.riffrank.song.model.Genre;
import com.riffrank.song.repo.SongRepository;
import com.riffrank.song.web.SongDto;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SongRankingService {
  private final SongRepository songRepository;
  private final double minimumVotes;

  public SongRankingService(
      SongRepository songRepository,
      @Value("${riffrank.rating.minimum-votes:50}") double minimumVotes) {
    this.songRepository = songRepository;
    this.minimumVotes = minimumVotes;
  }

  public List<SongDto> top100(Genre genre) {
    Double avg = songRepository.genreAverageActualRating(genre);
    double c = avg == null ? 0.0 : avg;
    return songRepository.top100ByGenreWeighted(genre.name(), c, minimumVotes).stream()
        .map(
            row ->
                SongDto.fromTopRow(
                    row.getId(),
                    row.getTitle(),
                    genre,
                    row.getArtistId(),
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
