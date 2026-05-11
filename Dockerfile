# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

RUN echo "export const environment = { production: true, supabase: { url: '${SUPABASE_URL}', anonKey: '${SUPABASE_ANON_KEY}' } };" \
    > src/environments/environment.ts

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist/forja/browser /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
