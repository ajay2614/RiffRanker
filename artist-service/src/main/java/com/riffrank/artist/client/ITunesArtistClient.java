package com.riffrank.artist.client;

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
public class ITunesArtistClient {
  private static final Logger logger = LoggerFactory.getLogger(ITunesArtistClient.class);
  private static final String BASE_URL = "https://itunes.apple.com/search";
  private final RestTemplate restTemplate;

  public ITunesArtistClient(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  public ITunesArtistSearchResult searchArtists(String query, int limit) {
    try {
      String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
      String url = String.format(
          "%s?term=%s&entity=musicArtist&limit=%d&media=music",
          BASE_URL, encodedQuery, limit);

      logger.info("Querying iTunes API for artists: {}", url);
      ITunesArtistSearchResult result = restTemplate.getForObject(url, ITunesArtistSearchResult.class);
      return result != null ? result : new ITunesArtistSearchResult(0, new java.util.ArrayList<>());
    } catch (RestClientException e) {
      logger.error("Error querying iTunes API for artists", e);
      throw new RuntimeException("Failed to fetch artist data from iTunes", e);
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ITunesArtistSearchResult {
    private int resultCount;
    private List<ITunesArtist> results;

    public ITunesArtistSearchResult() {}

    public ITunesArtistSearchResult(int resultCount, List<ITunesArtist> results) {
      this.resultCount = resultCount;
      this.results = results;
    }

    public int getResultCount() { return resultCount; }
    public void setResultCount(int resultCount) { this.resultCount = resultCount; }
    public List<ITunesArtist> getResults() { return results; }
    public void setResults(List<ITunesArtist> results) { this.results = results; }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ITunesArtist {
    private long artistId;
    private String artistName;
    private String primaryGenreName;

    public ITunesArtist() {}

    public long getArtistId() { return artistId; }
    public void setArtistId(long artistId) { this.artistId = artistId; }
    public String getArtistName() { return artistName; }
    public void setArtistName(String artistName) { this.artistName = artistName; }
    public String getPrimaryGenreName() { return primaryGenreName; }
    public void setPrimaryGenreName(String primaryGenreName) { this.primaryGenreName = primaryGenreName; }
  }
}