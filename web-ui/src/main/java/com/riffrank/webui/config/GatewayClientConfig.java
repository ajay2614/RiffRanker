package com.riffrank.webui.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class GatewayClientConfig {
  @Bean
  RestClient gatewayRestClient(@Value("${riffrank.gateway-base-url:http://localhost:8080}") String baseUrl) {
    return RestClient.builder().baseUrl(baseUrl).build();
  }
}

