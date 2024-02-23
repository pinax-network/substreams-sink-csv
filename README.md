# Substreams Sink CSV

### Install

```bash
$ npm install -g substreams-sink-csv
```

### SQL Table Schema

```sql
CREATE TABLE block_meta
(
    block_num   BIGINT,
    timestamp   TIMESTAMP,
    id          TEXT,
    hash        TEXT,
    parent_hash TEXT
);
```

**Reserved field names** to be used to expand the schema:

- `id` (TEXT NOT NULL PRIMARY KEY)
- `block_num` (BIGINT)
- `block_id` (TEXT)
- `cursor` (TEXT)
- `timestamp` (TIMESTAMP)
- `seconds` (BIGINT)
- `operation` (TEXT)

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
$ substreams-sink-csv run --schema schema.sql
```

### CSV filename schema

The CSV filename is generated using the following pattern:

```yml
<endpoint>-<module_hash>-<module_name>-<entity>.csv
```

Additionally, `*.clock` & `*.cursor` files are generated to keep track of the last block processed.

**Example:**

```yml
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out-block_meta.csv
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out.clock
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out.cursor
```