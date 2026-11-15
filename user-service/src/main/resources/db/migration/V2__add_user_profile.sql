alter table user_account
  add column display_name varchar(40) null,
  add column avatar_data longtext null,
  add column avatar_content_type varchar(50) null;
