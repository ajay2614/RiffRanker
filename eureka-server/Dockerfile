FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY eureka-server/pom.xml ./eureka-server/pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY artist-service/pom.xml ./artist-service/pom.xml
COPY song-service/pom.xml ./song-service/pom.xml
COPY user-service/pom.xml ./user-service/pom.xml
COPY web-ui/pom.xml ./web-ui/pom.xml
RUN mvn -q -DskipTests -pl eureka-server -am dependency:go-offline

COPY eureka-server/src ./eureka-server/src
RUN mvn -q -DskipTests -pl eureka-server -am package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/eureka-server/target/*.jar /app/app.jar
EXPOSE 8761
ENTRYPOINT ["java","-jar","/app/app.jar"]

