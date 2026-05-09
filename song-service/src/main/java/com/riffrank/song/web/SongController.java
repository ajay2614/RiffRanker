package com.riffrank.song.web;

import com.riffrank.song.client.ITunesSongClient;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@RestController
public class SongController {
  private final SongRepository songRepository;
  private final com.riffrank.song.repo.SongRatingRepository songRatingRepository;
  private final SongRankingService songRankingService;
  private final ITunesSongClient iTunesSongClient;

  public SongController(
      SongRepository songRepository,
      com.riffrank.song.repo.SongRatingRepository songRatingRepository,
      SongRankingService songRankingService,
      ITunesSongClient iTunesSongClient) {
    this.songRepository = songRepository;
    this.songRatingRepository = songRatingRepository;
    this.songRankingService = songRankingService;
    this.iTunesSongClient = iTunesSongClient;
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
  @Transactional
  public void addRating(
      @PathVariable UUID id,
      @RequestHeader(value = "X-USER-ID", required = false) UUID userId,
      @RequestBody AddRatingRequest request) {
    if (request.value() < 1 || request.value() > 10) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "value must be between 1 and 10");
    }
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "sign in required");
    }
    Song song =
        songRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "song not found"));

    java.time.Instant now = java.time.Instant.now();
    songRatingRepository
        .findBySongIdAndUserId(id, userId)
        .ifPresentOrElse(
            existing -> {
              int delta = request.value() - existing.getValue();
              existing.setValue(request.value());
              existing.setUpdatedAt(now);
              songRatingRepository.save(existing);
              songRepository.addRatingDelta(id, delta);
            },
            () -> {
              songRatingRepository.save(new com.riffrank.song.model.SongRating(id, userId, request.value(), now, now));
              songRepository.addRating(id, request.value());
            });
  }

  @GetMapping("/songs/search/itunes")
  public ExternalSearchResult searchITunes(
      @RequestParam("q") String q,
      @RequestParam(value = "limit", defaultValue = "20") int limit) {
    if (q == null || q.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "q is required");
    }
    ITunesSongClient.ITunesSearchResult iTunesResult = iTunesSongClient.searchSongs(q.trim(), limit);
    return ExternalSearchResult.fromITunes(iTunesResult);
  }

  @GetMapping("/songs/search/itunes/albums")
  public ExternalAlbumSearchResult searchITunesAlbums(
      @RequestParam("q") String q,
      @RequestParam(value = "limit", defaultValue = "20") int limit) {
    if (q == null || q.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "q is required");
    }
    ITunesSongClient.ITunesAlbumSearchResult iTunesResult = iTunesSongClient.searchAlbums(q.trim(), limit);
    return ExternalAlbumSearchResult.fromITunes(iTunesResult);
  }

  @GetMapping("/songs/search/itunes/top")
  public ExternalTopResult searchITunesTop(@RequestParam("q") String q) {
    if (q == null || q.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "q is required");
    }
    ITunesSongClient.ITunesAnySearchResult top = iTunesSongClient.searchTopAny(q.trim());
    ITunesSongClient.ITunesAnyResult first =
        (top.getResults() == null || top.getResults().isEmpty()) ? null : top.getResults().get(0);
    return ExternalTopResult.fromITunes(first);
  }

  public static class CreateSongRequest {
    private String title;
    private Genre genre;
    private UUID artistId;
    private String artistName;
    private String albumName;
    private Integer releaseYear;
    private String imageUrl;
    private String songUrl;

    public CreateSongRequest() {}

    public String title() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Genre genre() { return genre; }
    public void setGenre(Genre genre) { this.genre = genre; }
    public UUID artistId() { return artistId; }
    public void setArtistId(UUID artistId) { this.artistId = artistId; }
    public String artistName() { return artistName; }
    public void setArtistName(String artistName) { this.artistName = artistName; }
    public String albumName() { return albumName; }
    public void setAlbumName(String albumName) { this.albumName = albumName; }
    public Integer releaseYear() { return releaseYear; }
    public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }
    public String imageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String songUrl() { return songUrl; }
    public void setSongUrl(String songUrl) { this.songUrl = songUrl; }
  }

  public static class UpdateSongRequest {
    private String title;
    private Genre genre;
    private UUID artistId;
    private String artistName;
    private String albumName;
    private Integer releaseYear;
    private String imageUrl;
    private String songUrl;

    public UpdateSongRequest() {}

    public String title() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Genre genre() { return genre; }
    public void setGenre(Genre genre) { this.genre = genre; }
    public UUID artistId() { return artistId; }
    public void setArtistId(UUID artistId) { this.artistId = artistId; }
    public String artistName() { return artistName; }
    public void setArtistName(String artistName) { this.artistName = artistName; }
    public String albumName() { return albumName; }
    public void setAlbumName(String albumName) { this.albumName = albumName; }
    public Integer releaseYear() { return releaseYear; }
    public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }
    public String imageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String songUrl() { return songUrl; }
    public void setSongUrl(String songUrl) { this.songUrl = songUrl; }
  }

  public static class AddRatingRequest {
    private int value;

    public AddRatingRequest() {}

    public int value() { return value; }
    public void setValue(int value) { this.value = value; }
  }
}
