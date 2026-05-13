FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_ORCHESTRATION_URL=/api/orchestration
ARG VITE_DATA_URL=/api/data
ARG VITE_PROFILE_URL=/api/profile
ARG VITE_PATTERN_URL=/api/pattern
ARG VITE_AUTH_URL=/api/auth
ARG VITE_DOCUMENTATION_URL=

ENV VITE_ORCHESTRATION_URL=${VITE_ORCHESTRATION_URL}
ENV VITE_DATA_URL=${VITE_DATA_URL}
ENV VITE_PROFILE_URL=${VITE_PROFILE_URL}
ENV VITE_PATTERN_URL=${VITE_PATTERN_URL}
ENV VITE_AUTH_URL=${VITE_AUTH_URL}
ENV VITE_DOCUMENTATION_URL=${VITE_DOCUMENTATION_URL}

COPY ForesightX-frontend/package.json ./package.json
COPY ForesightX-frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY ForesightX-frontend .
RUN npm run build

FROM nginx:1.27-alpine

COPY ForesightX-frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
