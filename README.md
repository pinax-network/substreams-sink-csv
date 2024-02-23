# Substreams Sink CSV

### Install

```bash
$ npm install -g substreams-sink-csv
```

### SQL Table Schema

```sql
CREATE TABLE block_meta
(
    id          TEXT NOT NULL CONSTRAINT block_meta_pk PRIMARY KEY,
    at          TIMESTAMP,
    number      BIGINT,
    hash        TEXT,
    parent_hash TEXT,
    timestamp   TIMESTAMP
);
```

### Get Substreams API Key

- https://app.pinax.network
- https://app.streamingfast.io/

### Quickstart

**.env**
```env
SUBSTREAMS_API_KEY=<your-api-key>
MANIFEST=https://github.com/streamingfast/substreams-eth-block-meta/releases/download/v0.5.1/substreams-eth-block-meta-v0.5.1.spkg
MODULE_NAME=graph_out
SUBSTREAMS_ENDPOINT=eth.substreams.pinax.network:443
```

```bash
$ substreams-sink-csv --schema schema.sql
```