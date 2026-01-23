FROM node:21-alpine AS deps

RUN apk update && \
    apk add --no-cache libc6-compat autoconf automake libtool make tiff jpeg zlib zlib-dev pkgconf nasm file gcc musl-dev

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=80

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

FROM node:21-alpine
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

WORKDIR /app

# Ensure the /app directory and all its contents are owned by node user
COPY --chown=node:node . .
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
RUN chown -R node:node /app

USER node

RUN yarn build

CMD [ "yarn", "start", "-p", "80"]
