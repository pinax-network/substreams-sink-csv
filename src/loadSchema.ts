import fs from "fs";
import { readPackage } from "@substreams/manifest";
import { CSVRunOptions } from "../bin/cli.mjs";
import { createModuleHashHex } from "@substreams/core";
import { parseSchema } from "./parseSchema.js";
import { parseSchemaFromProto } from "./parseSchemaFromProto.js";

export enum OutputType {
  EntityChanges,
  Proto,
}

export type Schema = Map<string, string[]>;

// Load schema either from the supplied SQL schema file or from the proto file in the substreams package
export async function loadSchema(options: CSVRunOptions): Promise<{ tables: Schema, moduleHash: string, dataType: OutputType }>{
  // Read Substream
  const substreamPackage = await readPackage(options.manifest);
  if (!substreamPackage.modules) throw new Error("No modules found in substream package");

  console.log("substreamPackage.modules", JSON.stringify(substreamPackage.modules.modules.map((module) => module.name ), null, 2))
  const module = substreamPackage.modules.modules.find((module) => module.name === options.moduleName);
  const hash = await createModuleHashHex(substreamPackage.modules, options.moduleName);
  let dataType = OutputType.Proto;
  if (module?.output?.type.includes("entity.v1.EntityChanges")) dataType = OutputType.EntityChanges;

  let tables: Schema;
  if (dataType === OutputType.EntityChanges) {
    if (!options.schema || !fs.existsSync(options.schema)) throw new Error(`Schema file needed for EntityChanges output but not found: ${options.schema}`);
    const schema = fs.readFileSync(options.schema, "utf8");
    tables = parseSchema(schema);
  }
  else {
    tables = parseSchemaFromProto(substreamPackage, options.moduleName);
  }

  return { tables, moduleHash: hash, dataType};
}