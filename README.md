# Substreams Sink CSV
CSV sink lets you consume the output of a substreams module and write it into CSV files.

### Install

```bash
$ npm install -g substreams-sink-csv
```

### Get Substreams API Key and endpoints

- https://app.pinax.network
- https://app.streamingfast.io/

### Usage

There are two ways to write your substreams module output into CSV file:
- using untyped `graph_out`/`db_out` modules producing `EntityChanges`/`DatabaseChanges` outputs, and a schema defined in SQL file.
- using any map module output, in which case the sink will use the types defined in the packaged `.proto` definitions.


#### Using `EntityChanges`/`DatabaseChanges` and schema

1. Make sure your substreams package has `graph_out`/`db_out` with `EntityChanges`/`DatabaseChanges` output.
2. Define a schema

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
    The tables and fields must match the entities and fields created in the `graph_out`/`db_out` module.
    Note, you can use additional field names in your schema to enrich your rows from the stream metadata. The following field names can be used to expand the schema:

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
3. Start the sink with command line parameters (or ENV variables - see below):
    ```bash
    $ substreams-sink-csv \
        -e eth.substreams.pinax.network:443 \
        --schema schema.example.block_meta.sql \
        --module-name graph_out \
        --manifest https://spkg.io/streamingfast/substreams-eth-block-meta-v0.4.3.spkg \
        --substreams-api-key <your-api-key>
        -s 10000 \
        -t +100
    ```

#### Using repeated module output

Your module could be producing repeated messages, i.e. have output protobuf definition such as this for example:
```proto
message Events {
    repeated Transfer transfers = 1;
    repeated Mint mints = 2;
}
```
In this case, you can consume the module directly and the sink will use protobuf definitions to create the columns in your CSV file.
In the example above you will get two CSV files: `transfers.csv` and `mints.csv` with columns defined in the `Transfer` and `Mint` messages accordingly.
```bash
$ substreams-sink-csv \
    -e eth.substreams.pinax.network:443 \
    --manifest https://github.com/streamingfast/substreams-uniswap-v3/releases/download/v0.2.8/substreams.spkg \
    --module-name map_pools_created \
    --substreams-api-key <your-api-key>
    -s 12369821 \
    -t +100
```

### Environment variables
You can use environment variables instead of the CLI arguments. One way to use them is to provide `.env` file. For a full list of environment variables see `substreams-sink-csv --help`.

**.env**
```env
# Substreams Credentials
# https://app.pinax.network
# https://app.streamingfast.io
SUBSTREAMS_API_KEY=<your-api-key>
SUBSTREAMS_ENDPOINT=eth.substreams.pinax.network:443

# Substreams Package
MANIFEST=https://spkg.io/streamingfast/substreams-eth-block-meta-v0.4.3.spkg
MODULE_NAME=graph_out

# Substreams Package (Optional)
START_BLOCK=-7200
FINAL_BLOCKS_ONLY=true

# CSV Input
SCHEMA=schema.example.block_meta.sql

# CSV Output (Optional)
DELIMITER=","
FILENAME="data.csv"

### CSV filename schema

If `FILENAME` is not provided, the CSV output filename is generated using the following pattern:

```yml
<endpoint>-<module_hash>-<module_name>-<entity>.csv
```

Additionally, `*.clock`, `*.session` & `*.cursor` files are generated to keep track of the last block processed.

**Example:**

```yml
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out-block_meta.csv
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out.clock
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out.cursor
eth.substreams.pinax.network-3b180e1d2390afef1f22651581304e04245ba001-graph_out.session
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
            ...
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
$ clickhouse-client --query="INSERT INTO block_meta FORMAT CSV" < data-block_meta.csv
```

> Note that we use `FORMAT CSV` to let ClickHouse know we’re ingesting CSV formatted data. Alternatively, we can load data from a local file using the `FROM INFILE` clause:

```sql
INSERT INTO block_meta
FROM INFILE 'data-block_meta.csv'
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

## Docker environment

Pull from GitHub Container registry
```bash
docker pull ghcr.io/pinax-network/substreams-sink-csv:latest
```

Run with `.env` file
```bash
docker run -it --rm --env-file .env -v $PWD:/home ghcr.io/pinax-network/substreams-sink-csv:latest
```

Build from source
```bash
docker build -t substreams-sink-csv .
```