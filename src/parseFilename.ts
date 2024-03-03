import path from "path";
import fs from "fs";
import { CSVRunOptions } from "../bin/cli.mjs";

export function parseFilename(moduleHash: string, options: CSVRunOptions) {
  // user provided filename
  if ( options.filename ) {
    const name = path.parse(options.filename).name;
    const dirname = path.dirname(options.filename);
    // create directory if it doesn't exist
    if ( !fs.existsSync(dirname) ) fs.mkdirSync(dirname, { recursive: true });
    const cursorFile = `${name}.cursor`;
    const clockFile = `${name}.clock`;
    const sessionFile = `${name}.session`;
    return { name, cursorFile, clockFile, sessionFile };
  }

  // auto-generate filename (<network>-<moduleHash>-<moduleName>.csv)
  const network = parseNetwork(options.substreamsEndpoint);
  const name = `${network}-${moduleHash}-${options.moduleName}`
  const cursorFile = `${name}.cursor`;
  const clockFile = `${name}.clock`;
  const sessionFile = `${name}.session`;
  return { name, cursorFile, clockFile, sessionFile };
}

export function parseNetwork(endpoint: string) {
  if ( !endpoint.startsWith("http") ) endpoint = `http://${endpoint}`
  return new URL(endpoint).hostname;
}