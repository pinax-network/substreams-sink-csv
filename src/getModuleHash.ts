import { readPackage } from "@substreams/manifest";
import { CSVRunOptions } from "../bin/cli.js";
import { createModuleHashHex } from "@substreams/core";

export function isRemotePath(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

export async function getModuleHash(options: CSVRunOptions) {
    // Read Substream
    const substreamPackage = await readPackage(options.manifest);
    if (!substreamPackage.modules) {
      throw new Error("No modules found in substream package");
    }
    // validate if module is EntityChanges (graph_out)
    let valid = false;
    for ( const module of substreamPackage.modules.modules ) {
      if ( module.name === options.moduleName ) {
        if ( !module.output ) throw new Error("Module has no output");
        if ( module.output.type !== "proto:sf.substreams.sink.entity.v1.EntityChanges" ) throw new Error("Module output is not EntityChanges");
        valid = true;
      }
    }
    if ( !valid ) throw new Error(`No valid EntityChange module ${options.moduleName} found in substream package.`);
    return createModuleHashHex(substreamPackage.modules, options.moduleName);
  }