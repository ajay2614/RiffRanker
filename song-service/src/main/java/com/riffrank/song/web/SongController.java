package com.riffrank.song.web;

import com.riffrank.song.client.ITunesSongClient;
import com.riffrank.song.model.Genre;
import com.riffrank.song.model.Song;
import com.riffrank.song.repo.SongRepository;
import com.riffrank.song.service.SongRankingService;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
  public SongDto get(@PathVariable String id) {
    UUID songId = songUuidFromPath(id);
    Song song =
        songRepository
            .findById(songId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "song not found"));
    return SongDto.from(song, null);
  }

  @PatchMapping("/songs/{id}")
  public SongDto update(@PathVariable String id, @RequestBody UpdateSongRequest request) {
    UUID songId = songUuidFromPath(id);
    Song song =
        songRepository
            .findById(songId)
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
      @PathVariable String id,
      @RequestBody AddRatingRequest request,
      @RequestHeader(value = "X-USER-ID", required = false) String userIdHeader) {
    UUID songId = songUuidFromPath(id);
    if (request.value() < 1 || request.value() > 10) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "value must be between 1 and 10");
    }
    
    String userIdStr = userIdHeader;
    if (userIdStr == null || userIdStr.isBlank()) {
      // Fallback: Extract userId from SecurityContext (set by JwtAuthenticationFilter)
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      if (authentication != null && authentication.isAuthenticated()) {
        userIdStr = (String) authentication.getPrincipal();
      }
    }
    if (userIdStr == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "sign in required");
    }
    
    UUID userId;
    try {
      userId = UUID.fromString(userIdStr);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid user");
    }
    
    // Get or create song (upsert details when provided)
    Song song = songRepository.findById(songId).orElse(null);
    if (song == null) {
      // Song doesn't exist - create it if song details are provided
      if (request.title() == null || request.title().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "song not found and title is required to create it");
      }
      if (request.genre() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "song not found and genre is required to create it");
      }
      if (request.artistName() == null || request.artistName().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "song not found and artistName is required to create it");
      }
      if (request.songUrl() == null || request.songUrl().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "song not found and songUrl is required to create it");
      }
      if (request.releaseYear() != null && (request.releaseYear() < 1900 || request.releaseYear() > 2100)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseYear must be between 1900 and 2100");
      }
      
      song = new Song(
          songId,
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
      song = songRepository.save(song);
    } else {
      boolean changed = false;
      if (request.title() != null && !request.title().isBlank() && !request.title().trim().equals(song.getTitle())) {
        song.setTitle(request.title().trim());
        changed = true;
      }
      if (request.genre() != null && request.genre() != song.getGenre()) {
        song.setGenre(request.genre());
        changed = true;
      }
      if (request.artistId() != null && !request.artistId().equals(song.getArtistId())) {
        song.setArtistId(request.artistId());
        changed = true;
      }
      if (request.artistName() != null && !request.artistName().isBlank()
          && !request.artistName().trim().equals(song.getArtistName())) {
        song.setArtistName(request.artistName().trim());
        changed = true;
      }
      if (request.albumName() != null && !request.albumName().equals(song.getAlbumName())) {
        song.setAlbumName(request.albumName());
        changed = true;
      }
      if (request.releaseYear() != null && !request.releaseYear().equals(song.getReleaseYear())) {
        if (request.releaseYear() < 1900 || request.releaseYear() > 2100) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseYear must be between 1900 and 2100");
        }
        song.setReleaseYear(request.releaseYear());
        changed = true;
      }
      if (request.imageUrl() != null && !request.imageUrl().equals(song.getImageUrl())) {
        song.setImageUrl(request.imageUrl());
        changed = true;
      }
      if (request.songUrl() != null && !request.songUrl().isBlank() && !request.songUrl().trim().equals(song.getSongUrl())) {
        song.setSongUrl(request.songUrl().trim());
        changed = true;
      }
      if (changed) {
        songRepository.save(song);
      }
    }

    java.time.Instant now = java.time.Instant.now();
    songRatingRepository
        .findBySongIdAndUserId(songId, userId)
        .ifPresentOrElse(
            existing -> {
              int delta = request.value() - existing.getValue();
              existing.setValue(request.value());
              existing.setUpdatedAt(now);
              songRatingRepository.save(existing);
              songRepository.addRatingDelta(songId, delta);
            },
            () -> {
              songRatingRepository.save(
                  new com.riffrank.song.model.SongRating(songId, userId, request.value(), now, now));
              songRepository.addRating(songId, request.value());
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
    private String title;
    private Genre genre;
    private UUID artistId;
    private String artistName;
    private String albumName;
    private Integer releaseYear;
    private String imageUrl;
    private String songUrl;

    public AddRatingRequest() {}

    public int value() { return value; }
    public void setValue(int value) { this.value = value; }
    
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

  private static UUID songUuidFromPath(String rawId) {
    if (rawId == null || rawId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "song id is required");
    }
    String trimmed = rawId.trim();
    try {
      return UUID.fromString(trimmed);
    } catch (IllegalArgumentException ignored) {
      // Support external numeric/string ids (e.g., iTunes trackId) by mapping deterministically to a UUID.
      return UUID.nameUUIDFromBytes(("external-song-id:" + trimmed).getBytes(StandardCharsets.UTF_8));
    }
  }
}
