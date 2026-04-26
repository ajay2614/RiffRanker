create table song (
  id uuid primary key,
  title varchar(255) not null,
  genre varchar(50) not null,
  artist_id uuid,
  artist_name varchar(255) not null,
  album_name varchar(255),
  image_url varchar(2048),
  song_url varchar(2048) not null,
  rating_sum bigint not null,
  rating_count bigint not null,
  created_at timestamp with time zone not null
);

create index idx_song_genre on song (genre);
create index idx_song_title on song (title);
create index idx_song_artist_name on song (artist_name);
