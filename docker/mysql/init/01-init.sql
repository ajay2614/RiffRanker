create database if not exists riffrank_artist;
create database if not exists riffrank_song;
create database if not exists riffrank_user;

create user if not exists 'riffrank'@'%' identified by 'riffrank';
grant all privileges on riffrank_artist.* to 'riffrank'@'%';
grant all privileges on riffrank_song.* to 'riffrank'@'%';
grant all privileges on riffrank_user.* to 'riffrank'@'%';
flush privileges;

