import fs from "fs";
import { setup, fileCursor } from "substreams-sink";
import { CSVRunOptions } from "./bin/cli.js"
import { EntityChanges, getValuesInEntityChange } from "@substreams/sink-entity-changes/zod"
import logUpdate from "log-update";
import { getModuleHash } from "./src/getModuleHash.js";
import { parseFilename } from "./src/parseFilename.js";
import { parseClock } from "./src/parseClock.js";
import { parseSchema } from "./src/parseSchema.js";

export async function action(options: CSVRunOptions ) {
  // SQL schema
  if ( !fs.existsSync(options.schema) ) throw new Error(`Schema file not found: ${options.schema}`);
  const schema = fs.readFileSync(options.schema, "utf8");
  const tables = parseSchema(schema);

  // Cursor
  const moduleHash = await getModuleHash(options);
  const { name, cursorFile, blockFile } = parseFilename(moduleHash, options);
  const startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, "utf8") : '';

  // CSV writer (append)
  const blockWriter = fs.createWriteStream(blockFile, {flags: "a"});
  const writers: Map<string, fs.WriteStream> = new Map();

  for ( const [table, columns] of tables ) {
    const filename = `${name}.csv`;
    const writer = fs.createWriteStream(filename, {flags: "a"});
    if ( !fs.existsSync(filename) ) writer.write(columns.join(",") + "\n");
    writers.set(table, writer);
  }

  // write header if file is new
  if ( !fs.existsSync(blockFile) ) blockWriter.write("block_num,block_id,seconds,timestamp\n");

  // Block Emitter
  const { emitter } = await setup({ ...options, cursor: startCursor });

  // stats
  let rows = 0;
  let blocks = 0;

  emitter.on("clock", (clock) => {
    // write block to file
    // used to track how many blocks have been processed per module
    const { block_num, block_id, seconds, timestamp } = parseClock(clock);
    blockWriter.write(`${block_num},${block_id},${seconds},${timestamp}\n`);
  });

  // Stream Messages
  emitter.on("anyMessage", async (data, cursor, clock) => {
    const { block_num, timestamp } = parseClock(clock);

    // block header
    for ( const entityChange of EntityChanges.parse(data).entityChanges ) {
      const writer = writers.get(entityChange.entity);
      const table = tables.get(entityChange.entity);
      if ( !writer || !table ) continue; // skip if table not in schema
      const values = getValuesInEntityChange(entityChange);

      // order values based on table
      const data = table.map((column) => values[column] || null);

      // save CSV row
      writer.write(data.join(",") + "\n");
      rows++;
    };

    // logging
    logUpdate(`[substreams-sink-csv] block_num=${block_num} timestamp=${timestamp} blocks=${++blocks} rows=${++rows}`);
  });

  fileCursor.onCursor(emitter, cursorFile);
  emitter.start();
}
