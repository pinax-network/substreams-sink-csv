import { Clock } from "@substreams/core/proto"
import { EntityChange } from "@substreams/sink-entity-changes/zod";
import { parseClock, parseTimestamp } from "./parseClock.js";
import { Timestamp } from "@bufbuild/protobuf";

export function applyReservedFields( values: Record<string, unknown>, entityChange: EntityChange, cursor: string, clock: Clock ) {
    const { block_number, block_id, timestamp, seconds, milliseconds, nanos } = parseClock(clock);

    // **Reserved field names** to be used to expand the schema
    if ( !values["id"] ) values["id"] = entityChange.id;
    if ( !values["operation"] ) values["operation"] = entityChange.operation;
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