package com.riffrank.webui.web;

import com.riffrank.webui.model.ArtistDto;
import com.riffrank.webui.model.SongDto;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class SongPageController {
  private final RestClient gateway;

  public SongPageController(RestClient gatewayRestClient) {
    this.gateway = gatewayRestClient;
  }

  @GetMapping("/song/{id}")
  public String song(@PathVariable UUID id, Model model) {
    SongDto song =
        gateway.get().uri("/api/songs/{id}", id).retrieve().body(SongDto.class);
    if (song == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "song not found");
    }

    ArtistDto artist = null;
    if (song.artistId() != null) {
      try {
        artist = gateway.get().uri("/api/artists/{id}", song.artistId()).retrieve().body(ArtistDto.class);
      } catch (HttpClientErrorException e) {
        if (e.getStatusCode() != HttpStatus.NOT_FOUND) {
          throw e;
        }
      }
    }

    model.addAttribute("song", song);
    model.addAttribute("artist", artist);
    return "song";
  }

  @PostMapping("/song/{id}/rate")
  public String rate(@PathVariable UUID id, @RequestParam("value") int value) {
    gateway
        .post()
        .uri("/api/songs/{id}/ratings", id)
        .body(Map.of("value", value))
        .retrieve()
        .toBodilessEntity();
    return "redirect:/song/" + id;
  }
}

