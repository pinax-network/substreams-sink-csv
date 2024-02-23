import path from "path";
import fs from "fs";
import { CSVRunOptions } from "../bin/cli.js";

export function parseFilename(moduleHash: string, options: CSVRunOptions) {
    // user provided filename
    if ( options.filename ) {
      const name = path.parse(options.filename).name;
      const dirname = path.dirname(options.filename);
      // create directory if it doesn't exist
      if ( !fs.existsSync(dirname) ) fs.mkdirSync(dirname, { recursive: true });
      const cursorFile = `${name}.cursor`;
      const clockFile = `${name}.clock`;
      return { name, cursorFile, clockFile };
    }
    // auto-generate filename (<network>-<moduleHash>-<moduleName>.csv)
    const network = options.substreamsEndpoint.split(":")[0];
    const name = `${network}-${moduleHash}-${options.moduleName}`
    const cursorFile = `${name}.cursor`;
    const clockFile = `${name}.clock`;
    return { name, cursorFile, clockFile };
  }