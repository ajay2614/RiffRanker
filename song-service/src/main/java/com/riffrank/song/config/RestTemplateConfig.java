package com.riffrank.song.config;

import java.util.Arrays;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {
  @Bean
  public RestTemplate restTemplate(RestTemplateBuilder builder) {
    MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
    converter.setSupportedMediaTypes(Arrays.asList(
        MediaType.APPLICATION_JSON,
        MediaType.APPLICATION_OCTET_STREAM,
        new MediaType("text", "javascript"),
        new MediaType("application", "javascript")));
    return builder.additionalMessageConverters(converter).build();
  }
}
