create table song_rating (
  song_id uuid not null,
  user_id uuid not null,
  rating_value int not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  primary key (song_id, user_id)
);

create index idx_song_rating_user_id on song_rating (user_id);
