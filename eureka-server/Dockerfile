FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY eureka-server/pom.xml ./eureka-server/pom.xml
RUN mvn -q -DskipTests -pl eureka-server -am dependency:go-offline

COPY eureka-server/src ./eureka-server/src
RUN mvn -q -DskipTests -pl eureka-server -am package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/eureka-server/target/*.jar /app/app.jar
EXPOSE 8761
ENTRYPOINT ["java","-jar","/app/app.jar"]

