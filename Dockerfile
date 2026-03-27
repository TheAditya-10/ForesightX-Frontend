FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_ORCHESTRATION_URL=http://localhost:8000
ARG VITE_DATA_URL=http://localhost:8001
ARG VITE_PROFILE_URL=http://localhost:8002

ENV VITE_ORCHESTRATION_URL=${VITE_ORCHESTRATION_URL}
ENV VITE_DATA_URL=${VITE_DATA_URL}
ENV VITE_PROFILE_URL=${VITE_PROFILE_URL}

COPY ForesightX-frontend/package.json ./package.json
COPY ForesightX-frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY ForesightX-frontend .
RUN npm run build

FROM nginx:1.27-alpine

COPY ForesightX-frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
