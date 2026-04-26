package com.riffrank.webui.model;

import java.util.UUID;

public record SongDto(
    UUID id,
    String title,
    Genre genre,
    UUID artistId,
    String artistName,
    String albumName,
    Integer releaseYear,
    String imageUrl,
    String songUrl,
    long ratingCount,
    Double actualRating,
    Double weightedRating) {}
