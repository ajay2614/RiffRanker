# RiffRank

RiffRank is a music discovery and community-rating app. Users can search songs, artists, and albums; open detailed views; rate songs from 1–10; view the Top 100; read artist headlines; and manage a profile with a display name and avatar.

The current frontend is the React app in `react-ui`. The older `web-ui` Spring/Thymeleaf module is still present for compatibility, but it is not the primary frontend.

## Architecture

```text
                         +----------------------+
                         |   React UI (5173)    |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | API Gateway (8080)   |
                         +----+---------+-------+
                              |         |
             +----------------+         +----------------+
             v                                           v
   +-------------------+                         +-------------------+
   | Song Service      |                         | Artist Service    |
   | songs, ratings,   |                         | artists, news     |
   | Top 100           |                         +-------------------+
   +---------+---------+
             |
             v
   +-------------------+       +-------------------+
   | User Service      |       | MySQL              |
   | login, profiles   |       | artist/song/user DB|
   +-------------------+       +-------------------+

   Eureka (8761) provides service discovery for the backend services.
```

## Requirements

- Java 17 or newer
- Maven 3.9 or newer
- Node.js 18+ and npm
- Docker Desktop, used for local MySQL or the full EC2 stack

## Recommended local setup

The most predictable development setup is MySQL in Docker and each Spring service running locally.

### 1. Start MySQL

From the repository root:

```bash
docker compose up -d
```

This creates the `riffrank_artist`, `riffrank_song`, and `riffrank_user` databases and the local `riffrank` database user. The initialization script runs only when the MySQL volume is created for the first time.

Check it with:

```bash
docker compose ps
```

### 2. Start Eureka

In a new terminal:

```bash
mvn -pl eureka-server spring-boot:run
```

Wait until Eureka is available at <http://localhost:8761>.

### 3. Start the backend services

Open one terminal for each command:

```bash
mvn -pl api-gateway spring-boot:run
```

```bash
mvn -pl artist-service spring-boot:run -Dspring-boot.run.profiles=mysql
```

```bash
mvn -pl song-service spring-boot:run -Dspring-boot.run.profiles=mysql
```

```bash
mvn -pl user-service spring-boot:run -Dspring-boot.run.profiles=mysql
```

The user service runs Flyway migrations, including the profile fields migration. Artist and song services use Hibernate schema updates in the current development setup.

### 4. Start the React frontend

In another terminal:

```bash
cd react-ui
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>.

The React app calls the gateway at `http://localhost:8080`. Change `VITE_API_BASE_URL` in `react-ui/.env` if the gateway uses another address.

### Local service ports

| Component | Port | Purpose |
|---|---:|---|
| React UI | 5173 | Main frontend during development |
| API Gateway | 8080 | Frontend API entry point |
| Song Service | 8081 | Songs, ratings, Top 100, iTunes proxy |
| Artist Service | 8082 | Artists and news |
| Legacy web-ui | 8083 | Older Spring/Thymeleaf UI |
| User Service | 8084 | Authentication and profiles |
| Eureka | 8761 | Service discovery dashboard |
| MySQL | 3306 | Local databases |

## Local Docker backend

`docker-compose.local.yml` runs Eureka, gateway, artist service, song service, and the legacy `web-ui` against MySQL running on the host through `host.docker.internal`.

```bash
docker compose -f docker-compose.local.yml up -d --build \
  eureka-server api-gateway artist-service song-service
```

The React frontend is still started separately:

```bash
cd react-ui
npm run dev
```

For the current local Docker file, run `user-service` separately with the Maven command from the previous section. The complete containerized backend, including `user-service`, is defined in `docker-compose.ec2.yml`.

Stop the local Docker services with:

```bash
docker compose -f docker-compose.local.yml down
```

Do not add `-v` unless you intentionally want to delete the local MySQL data volume.

## Main user flows

- `/` — search, artist spotlight, album search, news, and featured chart content
- `/top` — ranked Top 100 songs
- `/profile` — display name, avatar upload, songs rated, and average rating
- `/signin` — login or registration

The frontend sends all API requests through the gateway:

```text
/api/users/**   -> user-service
/api/songs/**   -> song-service
/api/artists/** -> artist-service
```

## Ratings and ranking

Ratings use a 1–10 scale. Song service stores rating totals and calculates an IMDb-style weighted score for the Top 100:

```text
WR = (v / (v + m)) * R + (m / (v + m)) * C
```

Where `v` is the vote count, `R` is the song average, `C` is the chart average, and `m` is the minimum-vote threshold.

The Docker EC2 configuration uses `RIFFRANK_RATING_MINIMUM_VOTES=50`. Local MySQL development uses the service default unless overridden.

## Admin API

Admin writes currently use the `X-ADMIN-KEY` header. The development key is `dev-admin-key`; do not use that value in a public deployment.

Example:

```bash
curl -X POST http://localhost:8080/api/artists \
  -H 'Content-Type: application/json' \
  -H 'X-ADMIN-KEY: dev-admin-key' \
  -d '{"name":"Metallica"}'
```

Before deployment, provide the admin key through an environment variable and rotate it from the development value.

## EC2 deployment

The EC2 Compose file runs MySQL, Eureka, API Gateway, artist service, song service, user service, and the legacy web-ui in one Docker Compose project. It is a first-deployment setup, not a highly available production architecture.

### 1. Prepare the EC2 instance

Install Docker and Docker Compose on an Amazon Linux 2023 instance, then clone the repository:

```bash
git clone <your-repository-url> RiffRank
cd RiffRank
```

Open only the ports you actually need in the EC2 security group. Do not expose MySQL or Eureka publicly.

### 2. Configure production values

Before starting the stack, replace development values in `docker-compose.ec2.yml` with environment-injected secrets:

- MySQL root password
- MySQL application password
- `RIFFRANK_ADMIN_KEY`
- JWT secret
- Allowed frontend origin in API Gateway CORS

Do not commit production credentials to Git.

### 3. Start the EC2 stack

```bash
docker compose -f docker-compose.ec2.yml up -d --build
```

Check the containers:

```bash
docker compose -f docker-compose.ec2.yml ps
```

Check logs if a service is still starting:

```bash
docker compose -f docker-compose.ec2.yml logs -f api-gateway song-service user-service
```

The gateway should eventually respond to:

```bash
curl http://localhost:8080/actuator/health
```

### 4. Build and serve the React UI

The EC2 Compose file does not build the React app. Build it separately:

```bash
cd react-ui
npm ci
VITE_API_BASE_URL=http://<ec2-host-or-domain>:8080 npm run build
```

The generated static files are in `react-ui/dist`. For a real public deployment, serve these files through Nginx, S3/CloudFront, or another static hosting layer. Do not use the Vite development server as the permanent public frontend.

## Useful checks

```bash
curl http://localhost:8080/actuator/health
curl 'http://localhost:8080/api/songs/top'
curl 'http://localhost:8080/api/songs/search/itunes/albums?q=nevermind&limit=10'
```

If the gateway returns intermittent errors, check Eureka for duplicate stale service registrations. Stop old locally running Java services before starting their Docker replacements; otherwise Eureka may load-balance between old and new instances.

If MySQL appears empty after restarting, check the Docker volume. The initialization SQL is not rerun on an existing volume.

## Production hardening still needed

- Move secrets out of Compose and Git.
- Add HTTPS and a domain.
- Put MySQL on RDS or implement tested MySQL backups.
- Add container health checks and restart policies.
- Restrict security-group ports.
- Add rate limiting and stronger admin authorization.
- Add automated tests and deployment checks.
- Consider moving avatar data from database base64 storage to object storage when usage grows.
