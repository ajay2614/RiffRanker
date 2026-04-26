package com.riffrank.song.web;

import com.riffrank.song.model.Genre;
import com.riffrank.song.model.Song;
import com.riffrank.song.repo.SongRepository;
import com.riffrank.song.service.SongRankingService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class SongController {
  private final SongRepository songRepository;
  private final SongRankingService songRankingService;

  public SongController(SongRepository songRepository, SongRankingService songRankingService) {
    this.songRepository = songRepository;
    this.songRankingService = songRankingService;
  }

  @PostMapping("/songs")
  @ResponseStatus(HttpStatus.CREATED)
  public SongDto create(@RequestBody CreateSongRequest request) {
    if (request.title() == null || request.title().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
    }
    if (request.genre() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "genre is required");
    }
    if (request.artistName() == null || request.artistName().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "artistName is required");
    }
    if (request.songUrl() == null || request.songUrl().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "songUrl is required");
    }
    if (request.releaseYear() != null && (request.releaseYear() < 1900 || request.releaseYear() > 2100)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseYear must be between 1900 and 2100");
    }
    Song song =
        new Song(
            UUID.randomUUID(),
            request.title().trim(),
            request.genre(),
            request.artistId(),
            request.artistName().trim(),
            request.albumName(),
            request.releaseYear(),
            request.imageUrl(),
            request.songUrl().trim(),
            0,
            0,
            Instant.now());
    Song saved = songRepository.save(song);
    return SongDto.from(saved, null);
  }

  @GetMapping("/songs/{id}")
  public SongDto get(@PathVariable UUID id) {
    Song song =
        songRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "song not found"));
    return SongDto.from(song, null);
  }

  @PatchMapping("/songs/{id}")
  public SongDto update(@PathVariable UUID id, @RequestBody UpdateSongRequest request) {
    Song song =
        songRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "song not found"));

    if (request.title() != null) {
      if (request.title().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title cannot be blank");
      }
      song.setTitle(request.title().trim());
    }
    if (request.genre() != null) {
      song.setGenre(request.genre());
    }
    if (request.artistId() != null) {
      song.setArtistId(request.artistId());
    }
    if (request.artistName() != null) {
      if (request.artistName().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "artistName cannot be blank");
      }
      song.setArtistName(request.artistName().trim());
    }
    if (request.albumName() != null) {
      song.setAlbumName(request.albumName());
    }
    if (request.releaseYear() != null) {
      if (request.releaseYear() < 1900 || request.releaseYear() > 2100) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseYear must be between 1900 and 2100");
      }
      song.setReleaseYear(request.releaseYear());
    }
    if (request.imageUrl() != null) {
      song.setImageUrl(request.imageUrl());
    }
    if (request.songUrl() != null) {
      if (request.songUrl().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "songUrl cannot be blank");
      }
      song.setSongUrl(request.songUrl().trim());
    }

    Song saved = songRepository.save(song);
    return SongDto.from(saved, null);
  }

  @GetMapping("/songs/search")
  public List<SongDto> search(@RequestParam("q") String q) {
    if (q == null || q.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "q is required");
    }
    return songRepository.search(q.trim(), PageRequest.of(0, 50)).stream()
        .map(song -> SongDto.from(song, null))
        .toList();
  }

  @GetMapping("/songs/top")
  public List<SongDto> top100ByGenre(@RequestParam("genre") Genre genre) {
    return songRankingService.top100(genre);
  }

  @PostMapping("/songs/{id}/ratings")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void addRating(@PathVariable UUID id, @RequestBody AddRatingRequest request) {
    if (request.value() < 1 || request.value() > 10) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "value must be between 1 and 10");
    }
    int updated = songRepository.addRating(id, request.value());
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "song not found");
    }
  }

  public record CreateSongRequest(
      String title,
      Genre genre,
      UUID artistId,
      String artistName,
      String albumName,
      Integer releaseYear,
      String imageUrl,
      String songUrl) {}

  public record UpdateSongRequest(
      String title,
      Genre genre,
      UUID artistId,
      String artistName,
      String albumName,
      Integer releaseYear,
      String imageUrl,
      String songUrl) {}

  public record AddRatingRequest(int value) {}
}
