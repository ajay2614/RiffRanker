package com.riffrank.artist.client;

import com.riffrank.artist.web.ArtistNewsArticle;
import java.io.StringReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

@Component
public class GoogleNewsClient {
  private static final Logger logger = LoggerFactory.getLogger(GoogleNewsClient.class);
  private static final String RSS_URL = "https://news.google.com/rss/search?q=%s&hl=en-US&gl=US&ceid=US:en";
  private static final String BING_RSS_URL = "https://www.bing.com/news/search?q=%s&format=rss";
  private final RestTemplate restTemplate;

  public GoogleNewsClient(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  public List<ArtistNewsArticle> search(String artistName, int limit) {
    String encodedName = URLEncoder.encode(artistName + " music", StandardCharsets.UTF_8);
    List<String> feedUrls = List.of(
        RSS_URL.formatted(encodedName),
        BING_RSS_URL.formatted(encodedName));

    for (String feedUrl : feedUrls) {
      List<ArtistNewsArticle> articles = fetchFeed(feedUrl, limit, artistName);
      if (!articles.isEmpty()) return articles;
    }
    return List.of();
  }

  private List<ArtistNewsArticle> fetchFeed(String feedUrl, int limit, String artistName) {
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.set(HttpHeaders.USER_AGENT, "RiffRank/1.0 (+https://riffrank.com)");
      ResponseEntity<String> response = restTemplate.exchange(
          feedUrl,
          HttpMethod.GET,
          new HttpEntity<>(headers),
          String.class);
      String xml = response.getBody();
      if (xml == null || xml.isBlank()) return List.of();

      DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
      factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
      factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
      factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
      factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
      factory.setXIncludeAware(false);
      factory.setExpandEntityReferences(false);

      Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
      NodeList items = document.getElementsByTagName("item");
      List<ArtistNewsArticle> articles = new ArrayList<>();
      for (int index = 0; index < items.getLength() && articles.size() < Math.max(1, Math.min(limit, 5)); index++) {
        Node node = items.item(index);
        if (!(node instanceof Element item)) continue;

        String title = childText(item, "title");
        String link = childText(item, "link");
        if (title == null || title.isBlank() || link == null || link.isBlank()) continue;
        articles.add(new ArtistNewsArticle(
            title.trim(),
            link.trim(),
            childText(item, "source"),
            childText(item, "pubDate")));
      }
      return articles;
    } catch (RuntimeException exception) {
      logger.warn("Unable to fetch news feed for artist {}", artistName, exception);
      return List.of();
    } catch (Exception exception) {
      logger.warn("Unable to parse news feed for artist {}", artistName, exception);
      return List.of();
    }
  }

  private String childText(Element parent, String tagName) {
    NodeList matches = parent.getElementsByTagName(tagName);
    if (matches.getLength() == 0) return null;
    return matches.item(0).getTextContent();
  }
}
