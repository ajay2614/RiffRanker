package com.riffrank.song.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@RestController
public class ImageController {

  private final RestTemplate restTemplate = new RestTemplate();
  private final ObjectMapper objectMapper = new ObjectMapper();

  @GetMapping("/images/album")
  public ResponseEntity<Map<String, String>> getAlbumImage(
      @RequestParam String title,
      @RequestParam String artist,
      @RequestParam(required = false) String imageUrl) {

    try {
      // First, if we have an iTunes URL already, use it as fallback
      String fallbackUrl = "";
      if (imageUrl != null && !imageUrl.isEmpty()) {
        // Enhance existing iTunes URL to ultra HD: 1000x1000bb.jpg
        fallbackUrl = imageUrl
            .replaceAll("/\\d+x\\d+bb\\.jpg", "/1000x1000bb.jpg")
            .replaceAll("thumb/Music", "Music");
      }

      // Query iTunes Search API for album art
      // Search for album by artist + title combination
      String query = artist.replaceAll("\\s+", "+") + "+" + title.replaceAll("\\s+", "+");
      String iTunesUrl = String.format(
          "https://itunes.apple.com/search?term=%s&entity=album&limit=1",
          query
      );

      try {
        String response = restTemplate.getForObject(iTunesUrl, String.class);
        if (response != null) {
          JsonNode root = objectMapper.readTree(response);
          JsonNode results = root.get("results");
          
          if (results != null && results.size() > 0) {
            JsonNode firstResult = results.get(0);
            JsonNode artworkUrl = firstResult.get("artworkUrl600");
            
            if (artworkUrl != null && !artworkUrl.isNull()) {
              // iTunes provides 600x600, we can upgrade to 1000x1000
              String hdUrl = artworkUrl.asText()
                  .replaceAll("/\\d+x\\d+bb\\.jpg", "/1000x1000bb.jpg");
              return ResponseEntity.ok(Map.of("imageUrl", hdUrl));
            }
          }
        }
      } catch (Exception e) {
        System.err.println("iTunes API query failed: " + e.getMessage());
      }

      // Fallback to enhanced existing iTunes URL
      if (!fallbackUrl.isEmpty()) {
        return ResponseEntity.ok(Map.of("imageUrl", fallbackUrl));
      }

      // No image available
      return ResponseEntity.ok(Map.of("imageUrl", ""));

    } catch (Exception e) {
      System.err.println("Image processing error: " + e.getMessage());
      return ResponseEntity.ok(Map.of("imageUrl", ""));
    }
  }
}
