package com.riffrank.gateway.filter;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import reactor.core.publisher.Mono;

@Component
public class AuthHeaderFilter implements GlobalFilter, Ordered {
  private final WebClient userService;

  public AuthHeaderFilter(WebClient.Builder loadBalancedWebClientBuilder) {
    this.userService = loadBalancedWebClientBuilder.baseUrl("http://user-service").build();
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    String path = exchange.getRequest().getURI().getPath();
    boolean isRatingWrite =
        exchange.getRequest().getMethod() == HttpMethod.POST
            && path.matches("^/api/songs/[^/]+/ratings$");
    boolean isMyRatingRead =
        exchange.getRequest().getMethod() == HttpMethod.GET
            && path.matches("^/api/songs/[^/]+/ratings/me$");

    if (!isRatingWrite && !isMyRatingRead) {
      return chain.filter(exchange);
    }

    String token = bearerToken(exchange.getRequest().getHeaders());
    if (token == null) {
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }

    return userService
        .post()
        .uri("/tokens/validate")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(new ValidateRequest(token))
        .retrieve()
        .bodyToMono(ValidateResponse.class)
        .flatMap(
            v -> {
              if (v == null || !v.valid || v.userId == null) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
              }
              ServerWebExchange mutated =
                  exchange
                      .mutate()
                      .request(
                          r ->
                              r.headers(
                                  h -> {
                                    h.add("X-USER-ID", v.userId.toString());
                                    if (v.username != null) {
                                      h.add("X-USERNAME", v.username);
                                    }
                                  }))
                      .build();
              return chain.filter(mutated);
            })
        .onErrorResume(
            err -> {
              exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
              byte[] bytes = "user auth unavailable".getBytes(StandardCharsets.UTF_8);
              exchange.getResponse().getHeaders().setContentType(MediaType.TEXT_PLAIN);
              return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
            });
  }

  private static String bearerToken(HttpHeaders headers) {
    String auth = headers.getFirst(HttpHeaders.AUTHORIZATION);
    if (auth == null) return null;
    String trimmed = auth.trim();
    if (!trimmed.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) return null;
    String token = trimmed.substring("Bearer ".length()).trim();
    return token.isEmpty() ? null : token;
  }

  @Override
  public int getOrder() {
    return -100;
  }

  private record ValidateRequest(String token) {}

  private static class ValidateResponse {
    public boolean valid;
    public UUID userId;
    public String username;
  }
}
