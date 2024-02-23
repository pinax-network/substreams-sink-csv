#!/usr/bin/env node

import { Option } from "commander";
import { commander } from "substreams-sink";
import { action } from "../index.js";
import pkg from "../package.json" assert { type: "json" };

export interface CSVRunOptions extends commander.RunOptions {
  schema: string;
  filename?: string;
}

// Run Webhook Sink
const program = commander.program(pkg);
const command = commander.run(program, pkg);
command.addOption(new Option("--filename <string>", "CSV filename (default: '<endpoint>-<module_hash>-<module_name>.csv')").env("FILENAME"));
command.addOption(new Option("--schema <string>", "SQL Table Schema for CSV").default("schema.sql").env("SCHEMA"));
command.action(action);

program.parse();