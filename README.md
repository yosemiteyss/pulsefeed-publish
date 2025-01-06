# pulsefeed-publish

## Usage
- Subscribe to message queue and publish data to database.

### PATTERN_PUBLISH_FEED
- Consume scraped news articles, and insert to db.

## Setup
```bash
$ npm run submodule init
$ npm run submodule update
$ cp .env.local .env
$ npm install
$ npm run prisma:generate
```

## Run
```bash
$ npm run start
```

## Test
```bash
$ npm run test
```
