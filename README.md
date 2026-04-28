# RiffRank (Spring Boot microservices)

Microservice demo for ranking “Top 100 songs per genre” with:

- `eureka-server` (service discovery)
- `api-gateway` (single entry point)
- `artist-service` (artists)
- `song-service` (songs, ratings, Top 100 weighted ranking)
- `web-ui` (homepage search + top lists)

## Prereqs

- Java 17+
- Maven 3.9+

## Run (local)

In separate terminals:

1. `mvn -pl eureka-server spring-boot:run`
2. `mvn -pl api-gateway spring-boot:run`
3. `mvn -pl artist-service spring-boot:run`
4. `mvn -pl song-service spring-boot:run`
5. `mvn -pl web-ui spring-boot:run`

Then open:

- UI: `http://localhost:8080/`
- Eureka: `http://localhost:8761/`

## React UI (recommended)

Run the backend first (Eureka + Gateway + services), then in another terminal:

```bash
cd react-ui
npm install
npm run dev
```

Open `http://localhost:5173/`.

The React UI calls the gateway at `http://localhost:8080` by default. To change it:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## Run via Docker (uses your local MySQL on macOS)

If you don’t want to install Maven locally, you can run everything in containers and connect to your already-running MySQL (macOS provides `host.docker.internal`):

```bash
docker compose -f docker-compose.local.yml up -d --build
```

Open `http://localhost:8080/`.

## Use MySQL instead of in-memory H2

Start MySQL (creates `riffrank_artist` and `riffrank_song` + user `riffrank`/`riffrank`):

```bash
docker compose up -d
```

Run services with the MySQL profile:

```bash
mvn -pl artist-service spring-boot:run -Dspring-boot.run.profiles=mysql
mvn -pl song-service spring-boot:run -Dspring-boot.run.profiles=mysql
```

MySQL connection settings live in:

- `artist-service/src/main/resources/application-mysql.yml`
- `song-service/src/main/resources/application-mysql.yml`

## Admin actions (add artist / song)

Admin requests require header `X-ADMIN-KEY: dev-admin-key`.

Create an artist (via gateway):

```bash
curl -X POST http://localhost:8080/api/artists \
  -H 'Content-Type: application/json' \
  -H 'X-ADMIN-KEY: dev-admin-key' \
  -d '{"name":"Metallica","imageUrl":"https://example.com/metallica.jpg"}'
```

Create a song (via gateway):

```bash
curl -X POST http://localhost:8080/api/songs \
  -H 'Content-Type: application/json' \
  -H 'X-ADMIN-KEY: dev-admin-key' \
  -d '{
    "title":"Enter Sandman",
    "genre":"METAL",
    "artistName":"Metallica",
    "albumName":"Metallica",
    "imageUrl":"https://example.com/sandman.jpg",
    "songUrl":"https://example.com/play/enter-sandman"
  }'
```

Edit an artist (example: change image URL):

```bash
curl -X PATCH http://localhost:8080/api/artists/<ARTIST_UUID> \
  -H 'Content-Type: application/json' \
  -H 'X-ADMIN-KEY: dev-admin-key' \
  -d '{"imageUrl":"https://example.com/new-artist.jpg"}'
```

Edit a song (example: change image URL):

```bash
curl -X PATCH http://localhost:8080/api/songs/<SONG_UUID> \
  -H 'Content-Type: application/json' \
  -H 'X-ADMIN-KEY: dev-admin-key' \
  -d '{"imageUrl":"https://example.com/new-cover.jpg"}'
```

## User actions (search / rate / Top 100)

Search:

```bash
curl "http://localhost:8080/api/songs/search?q=sandman"
```

Rate a song (1–10):

```bash
curl -X POST http://localhost:8080/api/songs/<SONG_UUID>/ratings \
  -H 'Content-Type: application/json' \
  -d '{"value":10}'
```

Top 100 per genre (sorted by weighted rating):

```bash
curl "http://localhost:8080/api/songs/top?genre=METAL"
```

## Ranking approach

`song-service` stores:

- `ratingSum` and `ratingCount` (actual rating = `ratingSum / ratingCount`)
- Weighted rating for Top lists using an IMDb-style smoothing:
  - `WR = (v/(v+m))*R + (m/(v+m))*C`
  - `v`: votes for the song, `R`: song actual rating, `C`: genre average rating, `m`: minimum votes (default `50`)

## Notes

- Databases are in-memory H2 for local dev (data resets on restart).
- Ports: Eureka `8761`, Gateway `8080`, Song `8081`, Artist `8082`, Web UI `8083`.


- mvn -pl eureka-server clean spring-boot:run -Dspring-boot.run.profiles=mysql
- mvn -pl api-gateway spring-boot:run -Dspring-boot.run.profiles=mysql
- mvn -pl artist-service clean spring-boot:run -Dspring-boot.run.profiles=mysql
- mvn -pl song-service spring-boot:run -Dspring-boot.run.profiles=mysql

cd web-ui
np run dev