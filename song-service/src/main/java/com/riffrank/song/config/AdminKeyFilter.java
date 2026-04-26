package com.riffrank.song.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AdminKeyFilter extends OncePerRequestFilter {
  private final String adminKey;

  public AdminKeyFilter(@Value("${riffrank.admin-key:dev-admin-key}") String adminKey) {
    this.adminKey = adminKey;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    boolean isWrite =
        (HttpMethod.POST.matches(request.getMethod())
            || HttpMethod.PUT.matches(request.getMethod())
            || HttpMethod.PATCH.matches(request.getMethod())
            || HttpMethod.DELETE.matches(request.getMethod()));
    if (isWrite && request.getRequestURI().startsWith("/songs")) {
      String provided = request.getHeader("X-ADMIN-KEY");
      if (provided == null || !provided.equals(adminKey)) {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid X-ADMIN-KEY");
        return;
      }
    }
    filterChain.doFilter(request, response);
  }
}
