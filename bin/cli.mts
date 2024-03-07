#!/usr/bin/env node

import { Option } from "commander";
import { commander } from "substreams-sink";
import { action } from "../index.js";
import { version } from "../version.js";

export interface CSVRunOptions extends commander.RunOptions {
  schema: string;
  filename?: string;
  delimiter: string;
}

const name = "substreams-sink-csv";
const description = "Substreams Sink CSV";
const pkg = {name, version, description};

// Run Webhook Sink
const program = commander.program(pkg);
const command = commander.addRunOptions(program, {metrics: false, http: false});
command.addOption(new Option("--filename <string>", "CSV filename (default: '<endpoint>-<module_hash>-<module_name>.csv')").env("FILENAME"));
command.addOption(new Option("--schema <string>", "SQL table schema for CSV").default("schema.sql").env("SCHEMA"));
command.addOption(new Option("--delimiter <string>", "CSV delimiter").default(",").env("DELIMITER"));
command.action(action);

program.parse();