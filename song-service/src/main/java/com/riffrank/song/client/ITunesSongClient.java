package com.riffrank.song.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class ITunesSongClient {
  private static final Logger logger = LoggerFactory.getLogger(ITunesSongClient.class);
  private static final String BASE_URL = "https://itunes.apple.com/search";
  private final RestTemplate restTemplate;

  public ITunesSongClient(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  public ITunesSearchResult searchSongs(String query, int limit) {
    try {
      String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
      String url = String.format(
          "%s?term=%s&entity=song&limit=%d&media=music",
          BASE_URL, encodedQuery, limit);

      logger.info("Querying iTunes API: {}", url);
      ITunesSearchResult result = restTemplate.getForObject(url, ITunesSearchResult.class);
      return result != null ? result : new ITunesSearchResult(0, new java.util.ArrayList<>());
    } catch (RestClientException e) {
      logger.error("Error querying iTunes API", e);
      throw new RuntimeException("Failed to fetch song data from iTunes", e);
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ITunesSearchResult {
    private int resultCount;
    private List<ITunesSong> results;

    public ITunesSearchResult() {}

    public ITunesSearchResult(int resultCount, List<ITunesSong> results) {
      this.resultCount = resultCount;
      this.results = results;
    }

    public int getResultCount() { return resultCount; }
    public void setResultCount(int resultCount) { this.resultCount = resultCount; }
    public List<ITunesSong> getResults() { return results; }
    public void setResults(List<ITunesSong> results) { this.results = results; }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ITunesSong {
    private long trackId;
    private String trackName;
    private String artistName;
    private String collectionName;
    private String artworkUrl100;
    private String previewUrl;

    public ITunesSong() {}

    public long getTrackId() { return trackId; }
    public void setTrackId(long trackId) { this.trackId = trackId; }
    public String getTrackName() { return trackName; }
    public void setTrackName(String trackName) { this.trackName = trackName; }
    public String getArtistName() { return artistName; }
    public void setArtistName(String artistName) { this.artistName = artistName; }
    public String getCollectionName() { return collectionName; }
    public void setCollectionName(String collectionName) { this.collectionName = collectionName; }
    public String getArtworkUrl100() { return artworkUrl100; }
    public void setArtworkUrl100(String artworkUrl100) { this.artworkUrl100 = artworkUrl100; }
    public String getPreviewUrl() { return previewUrl; }
    public void setPreviewUrl(String previewUrl) { this.previewUrl = previewUrl; }
  }
}