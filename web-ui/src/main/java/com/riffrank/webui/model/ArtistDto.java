package com.riffrank.webui.model;

import java.util.UUID;

public record ArtistDto(
    UUID id,
    String name,
    String imageUrl,
    String biography,
    String spotifyUrl,
    String websiteUrl,
    java.time.Instant createdAt) {}
