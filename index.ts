import fs from "fs";
import path from "path";
import { setup, fileCursor } from "substreams-sink";
import { CSVRunOptions } from "./bin/cli.js"
import { EntityChanges, getValuesInEntityChange } from "@substreams/sink-entity-changes/zod"
import logUpdate from "log-update";
import { getModuleHash, isRemotePath } from "./src/getModuleHash.js";
import { parseFilename } from "./src/parseFilename.js";
import { parseClock } from "./src/parseClock.js";
import { parseSchema } from "./src/parseSchema.js";

export async function action(options: CSVRunOptions ) {
  // @substreams/manifest issue
  // if manifest is local, add current directory
  if (!isRemotePath(options.manifest) && !path.isAbsolute(options.manifest)) {
    const currentDir = process.cwd();
    options.manifest = path.join(currentDir, options.manifest);
  }
  if ( !fs.existsSync(options.manifest) ) throw new Error(`Manifest file not found: ${options.manifest}`);

  // SQL schema
  if ( !fs.existsSync(options.schema) ) throw new Error(`Schema file not found: ${options.schema}`);
  const schema = fs.readFileSync(options.schema, "utf8");
  const tables = parseSchema(schema);

  // Cursor
  const moduleHash = await getModuleHash(options);
  const { name, cursorFile, clockFile } = parseFilename(moduleHash, options);
  const startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, "utf8") : '';

  // CSV writer (append)
  const clockWriter = fs.createWriteStream(clockFile, {flags: "a"});
  const writers: Map<string, fs.WriteStream> = new Map();

  for ( const [table, columns] of tables ) {
    const filename = `${name}-${table}.csv`;
    const writer = fs.createWriteStream(filename, {flags: "a"});
    if ( !fs.existsSync(filename) ) writer.write(columns.join(",") + "\n");
    writers.set(table, writer);
  }

  // write header if file is new
  if ( !fs.existsSync(clockFile) ) clockWriter.write("block_num,block_id,seconds,timestamp\n");

  // Block Emitter
  const { emitter } = await setup({ ...options, cursor: startCursor });

  // stats
  let rows = 0;
  let blocks = 0;

  emitter.on("clock", (clock) => {
    // write block to file
    // used to track how many blocks have been processed per module
    const { block_num, block_id, seconds, timestamp } = parseClock(clock);
    clockWriter.write([block_num, block_id, seconds, timestamp].join(",") + '\n');
  });

  // Stream Messages
  emitter.on("anyMessage", async (data, cursor, clock) => {
    const { block_num, block_id, timestamp, seconds } = parseClock(clock);

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
    logUpdate(`[substreams-sink-csv] block_num=${block_num} timestamp=${timestamp} blocks=${++blocks} rows=${rows}`);
  });

  fileCursor.onCursor(emitter, cursorFile);
  emitter.start();
}
