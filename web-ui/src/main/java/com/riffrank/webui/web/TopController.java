package com.riffrank.webui.web;

import com.riffrank.webui.model.Genre;
import com.riffrank.webui.model.SongDto;
import java.util.List;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.client.RestClient;

@Controller
public class TopController {
  private final RestClient gateway;

  public TopController(RestClient gatewayRestClient) {
    this.gateway = gatewayRestClient;
  }

  @GetMapping("/top/{genre}")
  public String top(@PathVariable Genre genre, Model model) {
    List<SongDto> songs =
        gateway.get().uri(uriBuilder -> uriBuilder.path("/api/songs/top").queryParam("genre", genre).build())
            .retrieve()
            .body(new ParameterizedTypeReference<List<SongDto>>() {});

    model.addAttribute("genre", genre);
    model.addAttribute("songs", songs == null ? List.of() : songs);
    return "top";
  }
}

