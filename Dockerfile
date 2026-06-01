FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.output ./.output
USER appuser
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
