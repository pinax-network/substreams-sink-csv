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
**CLI**
```bash
$ substreams-sink-csv run --schema schema.sql
```

### Substreams Support

> Note: Support is only available for [`EntityChanges`](https://github.com/streamingfast/substreams-sink-entity-changes) using `graph_out` map module name.

- [x] [`EntityChanges`](https://github.com/streamingfast/substreams-sink-entity-changes)
- [ ] [`DatabaseChanges`](https://github.com/streamingfast/substreams-sink-database-changes)

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

### CLI Help

```bash
$ substreams-sink-csv --help

Usage: substreams-sink-csv run [options]

Substreams Sink CSV

Options:
  -e --substreams-endpoint <string>    Substreams gRPC endpoint to stream data from (env: SUBSTREAMS_ENDPOINT)
  --manifest <string>                  URL of Substreams package (env: MANIFEST)
  --module-name <string>               Name of the output module (declared in the manifest) (env: MODULE_NAME)
  -s --start-block <int>               Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming) (default: "-1", env: START_BLOCK)
  -t --stop-block <int>                Stop block to end stream at, inclusively (env: STOP_BLOCK)
  -p, --params <string...>             Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY) (default: [], env: PARAMS)
  --substreams-api-key <string>        API key for the Substream endpoint (env: SUBSTREAMS_API_KEY)
  --delay-before-start <int>           Delay (ms) before starting Substreams (default: 0, env: DELAY_BEFORE_START)
  --cursor <string>                    Cursor to stream from. Leave blank for no cursor
  --production-mode <boolean>          Enable production mode, allows cached Substreams data if available (default: "false", env: PRODUCTION_MODE)
  --inactivity-seconds <int>           If set, the sink will stop when inactive for over a certain amount of seconds (default: 300, env: INACTIVITY_SECONDS)
  --hostname <string>                  The process will listen on this hostname for any HTTP and Prometheus metrics requests (default: "localhost", env: HOSTNAME)
  --port <int>                         The process will listen on this port for any HTTP and Prometheus metrics requests (default: 9102, env: PORT)
  --metrics-labels [string...]         To apply generic labels to all default metrics (ex: --labels foo=bar) (default: {}, env: METRICS_LABELS)
  --collect-default-metrics <boolean>  Collect default metrics (default: "false", env: COLLECT_DEFAULT_METRICS)
  --headers [string...]                Set headers that will be sent on every requests (ex: --headers X-HEADER=headerA) (default: {}, env: HEADERS)
  --final-blocks-only <boolean>        Only process blocks that have pass finality, to prevent any reorg and undo signal by staying further away from the chain HEAD (default: "false", env: FINAL_BLOCKS_ONLY)
  --verbose <boolean>                  Enable verbose logging (default: "false", env: VERBOSE)
  --filename <string>                  CSV filename (default: '<endpoint>-<module_hash>-<module_name>.csv') (env: FILENAME)
  --schema <string>                    SQL Table Schema for CSV (default: "schema.sql", env: SCHEMA)
  -h, --help                           display help for command
```