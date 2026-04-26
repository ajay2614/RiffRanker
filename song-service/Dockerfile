FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY song-service/pom.xml ./song-service/pom.xml
RUN mvn -q -DskipTests -pl song-service -am dependency:go-offline

COPY song-service/src ./song-service/src
RUN mvn -q -DskipTests -pl song-service -am package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/song-service/target/*.jar /app/app.jar
EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]

