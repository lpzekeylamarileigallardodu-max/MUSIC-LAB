# 1) Compilar el frontend
FROM node:22-alpine AS front
WORKDIR /front
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Compilar el backend con el frontend adentro
FROM eclipse-temurin:21-jdk AS back
WORKDIR /back
COPY backend/ ./
COPY --from=front /front/dist ./src/main/resources/static
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon && rm -f build/libs/*-plain.jar

# 3) Imagen final liviana
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=back /back/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-Xmx350m","-jar","app.jar"]
