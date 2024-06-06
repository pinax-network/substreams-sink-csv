import fs from "fs";
import path from "path";
import { version } from './version.js'
import { setup, fileCursor } from "substreams-sink";
import { CSVRunOptions } from "./bin/cli.mjs"
import { EntityChanges, getValuesInEntityChange } from "@substreams/sink-entity-changes/zod"
import { DatabaseChanges, TableChange } from "@substreams/sink-database-changes/zod"
import logUpdate from "log-update";
import { parseFilename } from "./src/parseFilename.js";
import { parseClock } from "./src/parseClock.js";
import { writeRow } from "./src/writeRow.js";
import { applyReservedFields } from "./src/applyReservedFields.js";
import { OutputType, loadSchema } from "./src/loadSchema.js";
import { isRemotePath } from "./src/isRemotePath.js";

export async function action(options: CSVRunOptions ) {
  console.log(`[substreams-sink-csv] v${version}`);

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

  const { tables, moduleHash, dataType } = await loadSchema(options);

  // Cursor
  console.log(JSON.stringify({manifest: options.manifest, moduleName: options.moduleName, moduleHash}));
  const { name, dirname, cursorFile, clockFile, sessionFile } = parseFilename(moduleHash, options);
  const startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, "utf8") : '';
  console.log(JSON.stringify({name, dirname, cursorFile, clockFile, sessionFile}));

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
  let last_block_number = 0;
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
      totalBytesRead = Number(progress.processedBytes.totalBytesRead);
      totalBytesWritten = Number(progress.processedBytes.totalBytesWritten);
      runningJobs = progress.runningJobs.length;
    }
    log();
  });

  emitter.on("clock", (clock) => {
    // write block to file
    // used to track how many blocks have been processed per module
    const { block_number, block_id, seconds, timestamp } = parseClock(clock);
    writeRow(clockWriter, [block_number, block_id, seconds, timestamp], options)
  });

  // Stream Messages
  emitter.on("anyMessage", async (data, cursor, clock) => {
    const { block_number, timestamp, seconds } = parseClock(clock);
    blocks += last_block_number ? block_number - last_block_number : 1;
    last_block_number = block_number;
    last_timestamp = timestamp;
    last_seconds = seconds;

    if (dataType == OutputType.EntityChanges) {
      for ( const entityChange of EntityChanges.parse(data).entityChanges ) {
        const writer = writers.get(entityChange.entity);
        const table = tables.get(entityChange.entity);
        if ( !writer || !table ) continue; // skip if table not found
        const values = getValuesInEntityChange(entityChange);
        applyReservedFields(values, entityChange, cursor, clock);

        // order values based on table
        const data = table.map((column) => values[column]);

        // save CSV row
        writeRow(writer, data, options);
        rows++;
      }
    }
    else if (dataType == OutputType.DatabaseChanges) { // skip if table not found
      for ( const dbChange of DatabaseChanges.parse(data).tableChanges ) {
        const writer = writers.get(dbChange.table);
        const table = tables.get(dbChange.table);
        if ( !writer || !table ) continue;
        const values = getNewValuesInDatabaseChange(dbChange);
        applyReservedFields(values, dbChange, cursor, clock);

        // order columns based on table
        const data = table.map((column) => values[column]);

        // save CSV row
        writeRow(writer, data, options);
        rows++;
      }
    }
    else if (dataType == OutputType.Proto){
      for (const [table, columns] of tables) {
        if ( !data[table] ) continue; // skip if empty
        const writer = writers.get(table);
        if ( !writer ) throw new Error(`Table not found: ${table}`);
        for (const item of data[table] as Record<string, unknown>[]) {
          const values = columns.map(column => item[column] ?? "");
          writeRow(writer, values, options);
          rows++;
        }
      }
    }
    else {
      throw new Error(`Unknown output data type: ${dataType}`);
    }

    // logging
    log();
  });

  function log() {
    const now = Math.floor(Date.now() / 1000);
    if ( last_update == now ) return;
    last_update = now;
    const blocksPerSecond = Math.floor(blocks / (last_update - start));
    logUpdate(JSON.stringify({last_block_number, last_timestamp, blocks, rows, blocksPerSecond, totalBytesRead, totalBytesWritten, runningJobs}));
  }

  fileCursor.onCursor(emitter, cursorFile);
  emitter.start();
}

function getNewValuesInDatabaseChange(dbChange: TableChange) {
  return dbChange.fields.reduce((acc, cur) => {
    acc[cur.name] = cur.newValue;
    return acc;
  }, {} as Record<string, unknown>);
}
