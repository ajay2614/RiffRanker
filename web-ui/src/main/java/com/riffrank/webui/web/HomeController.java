package com.riffrank.webui.web;

import com.riffrank.webui.model.Genre;
import com.riffrank.webui.model.SongDto;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestClient;

@Controller
public class HomeController {
  private final RestClient gateway;

  public HomeController(RestClient gatewayRestClient) {
    this.gateway = gatewayRestClient;
  }

  @GetMapping("/")
  public String home(@RequestParam(name = "q", required = false) String q, Model model) {
    model.addAttribute("genres", Genre.values());
    model.addAttribute("q", q == null ? "" : q);

    if (q == null || q.isBlank()) {
      model.addAttribute("results", List.of());
      return "index";
    }

    List<SongDto> results =
        gateway.get().uri(uriBuilder -> uriBuilder.path("/api/songs/search").queryParam("q", q).build())
            .retrieve()
            .body(new org.springframework.core.ParameterizedTypeReference<List<SongDto>>() {});

    model.addAttribute("results", results == null ? List.of() : results);
    return "index";
  }
}

