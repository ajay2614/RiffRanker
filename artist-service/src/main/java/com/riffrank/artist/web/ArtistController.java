package com.riffrank.artist.web;

import com.riffrank.artist.model.Artist;
import com.riffrank.artist.repo.ArtistRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
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
public class ArtistController {
  private final ArtistRepository artistRepository;

  public ArtistController(ArtistRepository artistRepository) {
    this.artistRepository = artistRepository;
  }

  @PostMapping("/artists")
  @ResponseStatus(HttpStatus.CREATED)
  public Artist create(@RequestBody CreateArtistRequest request) {
    if (request.name() == null || request.name().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
    }
    Artist artist =
        new Artist(
            UUID.randomUUID(),
            request.name().trim(),
            request.imageUrl(),
            request.biography(),
            request.spotifyUrl(),
            request.websiteUrl(),
            Instant.now());
    return artistRepository.save(artist);
  }

  @GetMapping("/artists/{id}")
  public Artist get(@PathVariable UUID id) {
    return artistRepository
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "artist not found"));
  }

  @PatchMapping("/artists/{id}")
  public Artist update(@PathVariable UUID id, @RequestBody UpdateArtistRequest request) {
    Artist artist =
        artistRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "artist not found"));

    if (request.name() != null) {
      if (request.name().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name cannot be blank");
      }
      artist.setName(request.name().trim());
    }
    if (request.imageUrl() != null) {
      artist.setImageUrl(request.imageUrl());
    }
    if (request.biography() != null) {
      artist.setBiography(request.biography());
    }
    if (request.spotifyUrl() != null) {
      artist.setSpotifyUrl(request.spotifyUrl());
    }
    if (request.websiteUrl() != null) {
      artist.setWebsiteUrl(request.websiteUrl());
    }

    return artistRepository.save(artist);
  }

  @GetMapping("/artists/search")
  public List<Artist> search(@RequestParam("name") String name) {
    if (name == null || name.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name query is required");
    }
    return artistRepository.findTop25ByNameContainingIgnoreCaseOrderByNameAsc(name.trim());
  }

  public record CreateArtistRequest(
      String name, String imageUrl, String biography, String spotifyUrl, String websiteUrl) {}

  public record UpdateArtistRequest(
      String name, String imageUrl, String biography, String spotifyUrl, String websiteUrl) {}
}
