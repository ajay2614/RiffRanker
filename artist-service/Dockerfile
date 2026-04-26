FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY artist-service/pom.xml ./artist-service/pom.xml
RUN mvn -q -DskipTests -pl artist-service -am dependency:go-offline

COPY artist-service/src ./artist-service/src
RUN mvn -q -DskipTests -pl artist-service -am package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/artist-service/target/*.jar /app/app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]

