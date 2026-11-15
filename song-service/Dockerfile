FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY song-service/pom.xml ./song-service/pom.xml
COPY eureka-server/pom.xml ./eureka-server/pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY artist-service/pom.xml ./artist-service/pom.xml
COPY user-service/pom.xml ./user-service/pom.xml
COPY web-ui/pom.xml ./web-ui/pom.xml
RUN mvn -q -DskipTests -pl song-service -am dependency:go-offline

COPY song-service/src ./song-service/src
RUN mvn -q -DskipTests -pl song-service -am package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/song-service/target/*.jar /app/app.jar
EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]

