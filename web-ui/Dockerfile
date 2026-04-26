FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./pom.xml
COPY web-ui/pom.xml ./web-ui/pom.xml
RUN mvn -q -DskipTests -pl web-ui -am dependency:go-offline

COPY web-ui/src ./web-ui/src
RUN mvn -q -DskipTests -pl web-ui -am package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/web-ui/target/*.jar /app/app.jar
EXPOSE 8083
ENTRYPOINT ["java","-jar","/app/app.jar"]

