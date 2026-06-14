package com.riffrank.song.repo;

import com.riffrank.song.model.Genre;
import com.riffrank.song.model.Song;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface SongRepository extends JpaRepository<Song, UUID> {
  Optional<Song> findByExternalId(String externalId);

  Optional<Song> findFirstByTitleIgnoreCaseAndArtistNameIgnoreCase(String title, String artistName);

  @Query(
      "select s from Song s " +
      "where lower(s.title) like lower(concat('%', :q, '%')) " +
      "   or lower(s.artistName) like lower(concat('%', :q, '%')) " +
      "order by s.title asc")
  List<Song> search(@Param("q") String q, Pageable pageable);

  @Query(
      "select avg(cast(s.ratingSum as double) / s.ratingCount) " +
      "from Song s " +
      "where s.genre = :genre and s.ratingCount > 0")
  Double genreAverageActualRating(@Param("genre") Genre genre);

  @Query(
      "select avg(cast(s.ratingSum as double) / s.ratingCount) " +
      "from Song s " +
      "where s.ratingCount > 0")
  Double globalAverageActualRating();

  @Query(
      value =
          "select " +
          "  min(cast(s.id as char(36))) as id, " +
          "  any_value(s.title) as title, " +
          "  any_value(s.genre) as genre, " +
          "  any_value(cast(s.artist_id as char(36))) as artistId, " +
          "  any_value(s.artist_name) as artistName, " +
          "  any_value(s.album_name) as albumName, " +
          "  any_value(s.release_year) as releaseYear, " +
          "  any_value(s.image_url) as imageUrl, " +
          "  any_value(s.song_url) as songUrl, " +
          "  sum(s.rating_sum) as ratingSum, " +
          "  sum(s.rating_count) as ratingCount, " +
          "  ( " +
          "    ( (cast(sum(s.rating_count) as double) / (cast(sum(s.rating_count) as double) + :m)) " +
          "      * coalesce((cast(sum(s.rating_sum) as double) / nullif(sum(s.rating_count), 0)), 0) ) " +
          "    + ( (:m / (cast(sum(s.rating_count) as double) + :m)) * :c ) " +
          "  ) as weightedRating " +
          "from song s " +
          "where s.genre = :genre " +
          "group by lower(s.title), lower(s.artist_name), coalesce(lower(s.album_name), '') " +
          "order by weightedRating desc " +
          "limit 100",
      nativeQuery = true)
  List<SongTopRow> top100ByGenreWeighted(
      @Param("genre") String genre, @Param("c") double c, @Param("m") double m);

  @Query(
      value =
          "select " +
          "  min(cast(s.id as char(36))) as id, " +
          "  any_value(s.title) as title, " +
          "  any_value(s.genre) as genre, " +
          "  any_value(cast(s.artist_id as char(36))) as artistId, " +
          "  any_value(s.artist_name) as artistName, " +
          "  any_value(s.album_name) as albumName, " +
          "  any_value(s.release_year) as releaseYear, " +
          "  any_value(s.image_url) as imageUrl, " +
          "  any_value(s.song_url) as songUrl, " +
          "  sum(s.rating_sum) as ratingSum, " +
          "  sum(s.rating_count) as ratingCount, " +
          "  ( " +
          "    ( (cast(sum(s.rating_count) as double) / (cast(sum(s.rating_count) as double) + :m)) " +
          "      * coalesce((cast(sum(s.rating_sum) as double) / nullif(sum(s.rating_count), 0)), 0) ) " +
          "    + ( (:m / (cast(sum(s.rating_count) as double) + :m)) * :c ) " +
          "  ) as weightedRating " +
          "from song s " +
          "group by lower(s.title), lower(s.artist_name), coalesce(lower(s.album_name), '') " +
          "order by weightedRating desc " +
          "limit 100",
      nativeQuery = true)
  List<SongTopRow> top100Weighted(@Param("c") double c, @Param("m") double m);

  @Transactional
  @Modifying
  @Query(
      value = "update song set rating_sum = rating_sum + :value, rating_count = rating_count + 1 where id = :id",
      nativeQuery = true)
  int addRating(@Param("id") UUID id, @Param("value") int value);

  @Transactional
  @Modifying
  @Query(
      value = "update song set rating_sum = rating_sum + :delta where id = :id",
      nativeQuery = true)
  int addRatingDelta(@Param("id") UUID id, @Param("delta") int delta);

  Optional<Song> findById(UUID id);

  interface SongTopRow {
    String getId();

    String getTitle();

    String getGenre();

    String getArtistId();

    String getArtistName();

    String getAlbumName();

    Integer getReleaseYear();

    String getImageUrl();

    String getSongUrl();

    long getRatingSum();

    long getRatingCount();

    double getWeightedRating();
  }
}
