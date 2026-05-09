create table user_account (
  id char(36) primary key,
  username varchar(64) not null unique,
  password_hash varchar(255) not null,
  created_at bigint not null
);

create table auth_token (
  token varchar(64) primary key,
  user_id char(36) not null,
  expires_at bigint not null,
  created_at bigint not null
);

create index idx_auth_token_user_id on auth_token (user_id);
create index idx_auth_token_expires_at on auth_token (expires_at);

