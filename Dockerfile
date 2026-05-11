# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

RUN test -n "$SUPABASE_URL" || (echo "ERROR: SUPABASE_URL build arg is missing" && exit 1)
RUN test -n "$SUPABASE_ANON_KEY" || (echo "ERROR: SUPABASE_ANON_KEY build arg is missing" && exit 1)

RUN printf 'export const environment = {\n  production: true,\n  supabase: {\n    url: "%s",\n    anonKey: "%s",\n  },\n};\n' \
    "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > src/environments/environment.ts

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist/forja/browser /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
