create table artist (
  id uuid primary key,
  name varchar(255) not null,
  image_url varchar(2048),
  created_at timestamp with time zone not null
);

create index idx_artist_name on artist (name);

