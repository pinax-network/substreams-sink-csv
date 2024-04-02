import type { Package } from "@substreams/core/proto";
import { FieldDescriptorProto_Type, FieldDescriptorProto_Label } from "@bufbuild/protobuf";
import { Schema } from "./loadSchema.js";

// Parse schema from output protobuf found in the substreams package
export function parseSchemaFromProto(substreamPackage: Package, moduleName: string): Schema {

  if (!substreamPackage.modules) throw new Error("No modules found in substream package");

  const type = substreamPackage.modules?.modules.find((module) => module.name === moduleName)?.output?.type;
  if (!type) throw new Error(`Substreams package doesn't contain module ${moduleName}`);

  // type == proto:antelope.eosio.token.v1.Accounts
  const pkgProtoName = type.slice("proto:".length);   // antelope.eosio.token.v1.Accounts
  const pos = pkgProtoName.lastIndexOf('.');
  const pkgName = pkgProtoName.slice(0, pos);         // antelope.eosio.token.v1
  const messageName = pkgProtoName.slice(pos + 1)     // Accounts

  const proto = substreamPackage.protoFiles.find((protoFile) => protoFile.package === pkgName);
  const fields = proto
    ?.messageType
    ?.find(message => message.name === messageName)
    ?.field.filter((field) => field.type === FieldDescriptorProto_Type.MESSAGE && field.label === FieldDescriptorProto_Label.REPEATED)
    ?.map((field) => ({ name: field.jsonName ?? "unknown", type: field.typeName?.split('.')?.pop() as string })) ?? [];

  // message Events {
  //   repeated Transfer transfers = 1;
  //   repeated Mint mints = 2;
  // }
  const schema = fields.reduce((acc, {name, type}) => {
    // search for Transfer/Mint type either in the root or as nested type for Events type
    const nested = proto
      ?.messageType
      .find(message => message.name === type)
      ?? proto
        ?.messageType
        .find(message => message.name === messageName)
        ?.nestedType.find(message => message.name === type)
    if (!nested) throw new Error(`Can't find a type: ${type}`);
    acc.set(name, nested.field.map((field) => field.jsonName ?? "") ?? []);
    return acc;
  }, new Map<string, string[]>());

  if(!schema) throw new Error(`Invalid module output type: ${pkgProtoName}. Must contain repeated fields.`);

  return schema
}