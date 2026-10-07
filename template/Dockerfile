FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Full backend /api URL baked in at build time (or "/api" if nginx proxies, see nginx.conf)
ARG VITE_API_URL=/api
ARG VITE_APP_NAME="My App"
ENV VITE_API_URL=$VITE_API_URL VITE_APP_NAME=$VITE_APP_NAME
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8000
EXPOSE 80
