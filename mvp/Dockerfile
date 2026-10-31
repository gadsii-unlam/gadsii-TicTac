FROM node:22-bookworm-slim AS web-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
RUN npx expo export --platform web

FROM nginx:alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/dist /usr/share/nginx/html

FROM node:22-bookworm-slim AS api

ENV NODE_ENV=production \
    PORT=3000 \
    NODO_DATA_DIR=/data
WORKDIR /app
RUN mkdir -p /data && chown node:node /data
COPY --chown=node:node package.json ./
COPY --chown=node:node src/server ./src/server

USER node
EXPOSE 3000
CMD ["node", "src/server/index.js"]
