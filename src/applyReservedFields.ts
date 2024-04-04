import { Clock } from "@substreams/core/proto"
import { parseClock, parseTimestamp } from "./parseClock.js";
import { Timestamp } from "@bufbuild/protobuf";

type Metadata = {
    id?: string;
    pk?: string;
    compositePk?: { keys: Record<string, string>; };
    operation: string;
}

export function applyReservedFields( values: Record<string, unknown>, meta: Metadata, cursor: string, clock: Clock ) {
    const { block_number, block_id, timestamp, seconds, milliseconds, nanos } = parseClock(clock);

    // **Reserved field names** to be used to expand the schema
    if ( !values["id"] && meta.id ) values["id"] = meta.id;     // id for entity changes
    if ( !values["id"] && meta.pk) values["id"] = meta.pk;      // id for db changes
    if ( !values["id"] && meta.compositePk ) values["id"] = Object.entries(meta.compositePk.keys).sort((a,b) => a[0].localeCompare(b[0])).map(([k,v]) => `${k}:${v}`).join(";"); // id for composite pk
    if ( !values["operation"] ) values["operation"] = meta.operation;
    if ( !values["cursor"] ) values["cursor"] = cursor;
    if ( !values["block"] ) values["block"] = block_number;
    if ( !values["block_num"] ) values["block_num"] = block_number;
    if ( !values["block_number"] ) values["block_number"] = block_number;
    if ( !values["block_id"] ) values["block_id"] = block_id;
    if ( !values["seconds"] ) values["seconds"] = seconds;
    if ( !values["milliseconds"] ) values["milliseconds"] = milliseconds;
    if ( !values["millis"] ) values["millis"] = milliseconds;
    if ( !values["nanos"] ) values["nanos"] = nanos;
    if ( !values["nanoseconds"] ) values["nanoseconds"] = nanos;
    if ( !values["timestamp"] ) values["timestamp"] = timestamp;

    // exception parsing timestamp
    if ( values["timestamp"] ) values["timestamp"] = parseTimestamp(Timestamp.fromDate(new Date(values["timestamp"] as string)));
    else values["timestamp"] = timestamp;

    return values;
}