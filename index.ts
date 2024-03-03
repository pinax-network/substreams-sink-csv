import fs from "fs";
import path from "path";
import pkg from "./package.json" assert { type: "json" };
import { setup, fileCursor } from "substreams-sink";
import { CSVRunOptions } from "./bin/cli.js"
import { EntityChanges, getValuesInEntityChange } from "@substreams/sink-entity-changes/zod"
import logUpdate from "log-update";
import { getModuleHash, isRemotePath } from "./src/getModuleHash.js";
import { parseFilename } from "./src/parseFilename.js";
import { parseClock } from "./src/parseClock.js";
import { parseSchema } from "./src/parseSchema.js";

export async function action(options: CSVRunOptions ) {
  console.log(`[substreams-sink-csv] v${pkg.version}`);

  // handle file system manifest
  // can be removed when issue resolved
  // https://github.com/substreams-js/substreams-js/issues/62
  if (!isRemotePath(options.manifest)) {
    // if manifest is not absolute, add current directory
    if ( !path.isAbsolute(options.manifest)) {
      const currentDir = process.cwd();
      options.manifest = path.join(currentDir, options.manifest);
    }
    if ( !fs.existsSync(options.manifest) ) throw new Error(`Manifest file not found: ${options.manifest}`);
  }

  // SQL schema
  if ( !fs.existsSync(options.schema) ) throw new Error(`Schema file not found: ${options.schema}`);
  const schema = fs.readFileSync(options.schema, "utf8");
  const tables = parseSchema(schema);

  // Cursor
  const moduleHash = await getModuleHash(options);
  console.log(JSON.stringify({manifest: options.manifest, moduleName: options.moduleName, moduleHash}));
  const { name, cursorFile, clockFile, sessionFile } = parseFilename(moduleHash, options);
  const startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, "utf8") : '';
  console.log(JSON.stringify({name, cursorFile, clockFile, sessionFile}));

  // CSV writer (append)
  const clockWriter = fs.createWriteStream(clockFile, {flags: "a"});
  const writers: Map<string, fs.WriteStream> = new Map();

  for ( const [table, columns] of tables ) {
    console.log(JSON.stringify({table, columns}));
    const filename = `${name}-${table}.csv`;
    const writer = fs.createWriteStream(filename, {flags: "a"});
    if ( !fs.existsSync(filename) ) writer.write(columns.join(",") + "\n");
    writers.set(table, writer);
  }

  // write header if file is new
  if ( !fs.existsSync(clockFile) ) clockWriter.write("block_num,block_id,seconds,timestamp\n");

  // Block Emitter
  const { emitter } = await setup({ ...options, cursor: startCursor });

  // log stats
  let rows = 0;
  let blocks = 0;
  let last_block_num = 0;
  let last_timestamp = "";
  let totalBytesRead = 0;
  let totalBytesWritten = 0;
  let traceId = "";
  let resolvedStartBlock = 0;
  let maxParallelWorkers = 0;
  let runningJobs = 0;
  let last_seconds = 0;
  let start = Math.floor(Date.now() / 1000); // seconds
  let last_update = 0;

  emitter.on("session", (session) => {
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
    traceId = session.traceId;
    resolvedStartBlock = Number(session.resolvedStartBlock);
    maxParallelWorkers = Number(session.maxParallelWorkers)
    console.log(JSON.stringify({traceId, resolvedStartBlock, maxParallelWorkers}));
  });

  emitter.on("progress", (progress) => {
    if ( progress.processedBytes ) {
      totalBytesRead += Number(progress.processedBytes.totalBytesRead);
      totalBytesWritten += Number(progress.processedBytes.totalBytesWritten);
      runningJobs = progress.runningJobs.length;
    }
    log();
  });

  emitter.on("clock", (clock) => {
    // write block to file
    // used to track how many blocks have been processed per module
    const { block_num, block_id, seconds, timestamp } = parseClock(clock);
    clockWriter.write([block_num, block_id, seconds, timestamp].join(",") + '\n');
  });

  // Stream Messages
  emitter.on("anyMessage", async (data, cursor, clock) => {
    const { block_num, block_id, timestamp, seconds } = parseClock(clock);
    last_block_num = block_num;
    last_timestamp = timestamp;
    last_seconds = seconds;

    // block header
    for ( const entityChange of EntityChanges.parse(data).entityChanges ) {
      const writer = writers.get(entityChange.entity);
      const table = tables.get(entityChange.entity);
      if ( !writer || !table ) throw new Error(`Table not found: ${entityChange.entity}`);
      const values = getValuesInEntityChange(entityChange);

      // **Reserved field names** to be used to expand the schema
      values["id"] = entityChange.id;
      values["cursor"] = cursor;
      values["operation"] = entityChange.operation;
      values["block_id"] = block_id;
      values["block_num"] = block_num;
      values["timestamp"] = timestamp;
      values["seconds"] = seconds;

      // order values based on table
      const data = table.map((column) => {
        const value = values[column];
        if ( value === undefined ) return null;
        if ( typeof value == "string" && value.includes(",") ) return `"${value}"`; // escape commas
        return value;
      });

      // save CSV row
      writer.write(data.join(",") + "\n");
      rows++;
    };

    // logging
    blocks++;
    log();
  });

  function log() {
    const now = Math.floor(Date.now() / 1000);
    if ( last_update != now) {
      last_update = now;
      const blocksPerSecond = Math.floor(blocks / (last_update - start));
      logUpdate(JSON.stringify({last_block_num, last_timestamp, blocks, rows, blocksPerSecond, totalBytesRead, totalBytesWritten, runningJobs}));
    }
  }

  fileCursor.onCursor(emitter, cursorFile);
  emitter.start();
}
