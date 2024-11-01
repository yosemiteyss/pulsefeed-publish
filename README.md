## Setup Project

```bash
$ cp .env.local .env

$ git submodule init
$ git submodule update

$ npm install

$ npm run prisma:generate

$ npm run build
```

## Run App

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
$ npm run test
```