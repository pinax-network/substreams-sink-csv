# Substreams Sink CSV

### Install

```bash
$ npm install -g substreams-sink-csv
```

### SQL Table Schema
**schema.sql**
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

- `id` (String)
- `block_number` (UInt64)
  - `block`
  - `block_num`
- `block_id` (String)
- `cursor` (String)
- `timestamp` (DateTime)
- `seconds` (Int64)
- `nanos` (Int32)
    - `nanoseconds`
- `milliseconds` (Int64)
    - `millis`
- `operation` (String)

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
SCHEMA=schema.example.sql
FINAL_BLOCKS_ONLY=true
START_BLOCK=2
DELIMITER=","
```
**CLI** with `.env` file
```bash
$ substreams-sink-csv
```
**CLI** with `params`
```bash
$ substreams-sink-csv --schema schema.example.sql -e eth.substreams.pinax.network:443 --module-name graph_out --manifest https://github.com/streamingfast/substreams-eth-block-meta/releases/download/v0.5.1/substreams-eth-block-meta-v0.5.1.spkg --substreams-api-key <your-api-key>
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

Substreams Sink CSV

Options:
  -v, --version                      version for substreams-sink-csv
  -e --substreams-endpoint <string>  Substreams gRPC endpoint to stream data from (env: SUBSTREAMS_ENDPOINT)
  --manifest <string>                URL of Substreams package (env: MANIFEST)
  --module-name <string>             Name of the output module (declared in the manifest) (env: MODULE_NAME)
  -s --start-block <int>             Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming) (default: "-1", env: START_BLOCK)
  -t --stop-block <int>              Stop block to end stream at, inclusively (env: STOP_BLOCK)
  -p, --params <string...>           Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY) (default: [], env: PARAMS)
  --substreams-api-key <string>      API key for the Substream endpoint (env: SUBSTREAMS_API_KEY)
  --delay-before-start <int>         Delay (ms) before starting Substreams (default: 0, env: DELAY_BEFORE_START)
  --cursor <string>                  Cursor to stream from. Leave blank for no cursor
  --production-mode <boolean>        Enable production mode, allows cached Substreams data if available (choices: "true", "false", default: false, env: PRODUCTION_MODE)
  --final-blocks-only <boolean>      Only process blocks that have pass finality, to prevent any reorg and undo signal by staying further away from the chain HEAD (choices: "true", "false", default: false, env: FINAL_BLOCKS_ONLY)
  --inactivity-seconds <int>         If set, the sink will stop when inactive for over a certain amount of seconds (default: 300, env: INACTIVITY_SECONDS)
  --headers [string...]              Set headers that will be sent on every requests (ex: --headers X-HEADER=headerA) (default: {}, env: HEADERS)
  --plaintext <boolean>              Establish GRPC connection in plaintext (choices: "true", "false", default: false, env: PLAIN_TEXT)
  --verbose <boolean>                Enable verbose logging (choices: "true", "false", default: false, env: VERBOSE)
  --filename <string>                CSV filename (default: '<endpoint>-<module_hash>-<module_name>.csv') (env: FILENAME)
  --schema <string>                  SQL table schema for CSV (default: "schema.sql", env: SCHEMA)
  --delimiter <string>               CSV delimiter (default: ",", env: DELIMITER)
  -h, --help                         display help for command
```

## Using `pm2`

**Install pm2**
```bash
$ npm install -g pm2
$ npm install substreams-sink-csv
```

**ecosystem.config.js**
```js
module.exports = {
    apps: [{
        name: "substreams-sink-csv",
        script: "./node_modules/substreams-sink-csv/dist/bin/cli.mjs",
        env: {
            SUBSTREAMS_API_KEY: '<your-api-key>',
            MANIFEST: 'https://github.com/streamingfast/substreams-eth-block-meta/releases/download/v0.5.1/substreams-eth-block-meta-v0.5.1.spkg',
            MODULE_NAME: 'graph_out',
            SUBSTREAMS_ENDPOINT: 'eth.substreams.pinax.network:443',
            FINAL_BLOCKS_ONLY: 'true',
            START_BLOCK: '2',
            SCHEMA: 'schema.example.sql',
        }
    }]
}
```

**Start the process**
```bash
$ pm2 start
```

## Loading CSV Data into ClickHouse

[**Quick Install**](https://clickhouse.com/docs/en/install)
```bash
$ curl https://clickhouse.com/ | sh
```

**Start ClickHouse**
```bash
$ clickhouse server
```

**Connect to ClickHouse**
```bash
$ clickhouse client
```

**Create a ClickHouse table**

> Before importing data, let’s create a table with a relevant structure:
```sql
CREATE TABLE block_meta
(
    block_num   UInt64,
    timestamp   DateTime,
    id          String,
    hash        String,
    parent_hash String
)
ENGINE = ReplacingMergeTree()
ORDER BY block_num;
```

[**Load CSV data into ClickHouse**](https://clickhouse.com/docs/en/integrations/data-formats/csv-tsv)

> To import data from the CSV file to the `block_meta` table, we can pipe our file directly to the clickhouse-client:

```bash
$ clickhouse-client --query="INSERT INTO block_meta FORMAT CSV" < eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out-block_meta.csv
```

> Note that we use `FORMAT CSV` to let ClickHouse know we’re ingesting CSV formatted data. Alternatively, we can load data from a local file using the `FROM INFILE` clause:

```sql
INSERT INTO block_meta
FROM INFILE 'eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out-block_meta.csv'
FORMAT CSV
```

**Query the ClickHouse table**

```sql
SELECT * FROM block_meta LIMIT 10;
```

```yml
┌─block_num─┬───────────timestamp─┬─id────────────────┬─hash─────────────────────────────────────────┬─parent_hash──────────────────────────────────┐
│         2 │ 2015-07-30 15:26:57 │ day:last:20150730 │ tJWh1+ZmMVKuknCNpIQzN7lYFGAVooAvQZOkEARGmMk= │ iOltRTe+pNnAXRJUmQezJWHTvzH0Wq5zTNwRnxNAbLY= │
│         3 │ 2015-07-30 15:27:28 │ day:last:20150730 │ PWEiZgzIJDdvEe6EL4Ot3DUl4t1nVrm88K/6aqiM90E= │ tJWh1+ZmMVKuknCNpIQzN7lYFGAVooAvQZOkEARGmMk= │
│         4 │ 2015-07-30 15:27:57 │ day:last:20150730 │ I631o74PUjWzaUG8sptiUEJ47Fuc36J3uZK6Sno806I= │ PWEiZgzIJDdvEe6EL4Ot3DUl4t1nVrm88K/6aqiM90E= │
│         5 │ 2015-07-30 15:28:03 │ day:last:20150730 │ 83xjLTYeCpPwi6KbGixwjZyqPuGdHujSoCYSv/5J8Kk= │ I631o74PUjWzaUG8sptiUEJ47Fuc36J3uZK6Sno806I= │
│         6 │ 2015-07-30 15:28:27 │ day:last:20150730 │ HxrtjjaUoGdJbCSOYYec2pmwcJod+6zQtpN1DfBrMm4= │ 83xjLTYeCpPwi6KbGixwjZyqPuGdHujSoCYSv/5J8Kk= │
│         7 │ 2015-07-30 15:28:30 │ day:last:20150730 │ 4MfAtG4Ra4dDVNzm9kuFgb0jkYawPzCpeOPcOGVvcjo= │ HxrtjjaUoGdJbCSOYYec2pmwcJod+6zQtpN1DfBrMm4= │
│         8 │ 2015-07-30 15:28:32 │ day:last:20150730 │ LOlDQt8Ya6tBZcJoxDq5gtNgyUdPQp/sVWWt/F0fJYs= │ 4MfAtG4Ra4dDVNzm9kuFgb0jkYawPzCpeOPcOGVvcjo= │
│         9 │ 2015-07-30 15:28:35 │ day:last:20150730 │ mX5Hv0ysUJxid1PAY4WshmZB7G+INzT/eURBEADcV24= │ LOlDQt8Ya6tBZcJoxDq5gtNgyUdPQp/sVWWt/F0fJYs= │
│        10 │ 2015-07-30 15:28:48 │ day:last:20150730 │ T/SjiyeKtJ93OdOk7U4ScUOGqf33IZLy6PfaeCLxC00= │ mX5Hv0ysUJxid1PAY4WshmZB7G+INzT/eURBEADcV24= │
│        11 │ 2015-07-30 15:28:56 │ day:last:20150730 │ P151bD78uTCZNht93Q2r/qpZJDlDfByDbkQ8y4HpMkI= │ T/SjiyeKtJ93OdOk7U4ScUOGqf33IZLy6PfaeCLxC00= │
└───────────┴─────────────────────┴───────────────────┴──────────────────────────────────────────────┴──────────────────────────────────────────────┘

10 rows in set. Elapsed: 0.001 sec. Processed 8.19 thousand rows, 1.18 MB (5.51 million rows/s., 793.31 MB/s.)
```