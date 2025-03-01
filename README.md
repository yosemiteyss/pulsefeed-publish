# pulsefeed-publish

## Usage
- Subscribe to message queue and publish data to database.

### PUBLISH_FEED_PATTERN
- Consume scraped news articles, and insert to db.

### PUBLISH_KEYWORDS_PATTERN
- Consume publish keywords events, and generate keywords.

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
