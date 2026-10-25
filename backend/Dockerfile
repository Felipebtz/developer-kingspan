FROM maven:3.9.11-eclipse-temurin-17-alpine AS build

WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp package -DskipTests

FROM eclipse-temurin:17-jre-alpine AS runtime

RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

COPY --from=build --chown=spring:spring /workspace/target/*.jar /app/app.jar

USER spring:spring

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
