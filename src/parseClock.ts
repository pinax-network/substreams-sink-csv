import { Clock } from "@substreams/core/proto";
import { Timestamp } from "@bufbuild/protobuf";

export function parseClock(clock: Clock) {
  if ( !clock.timestamp ) throw new Error("Clock has no timestamp");
  const seconds = Number(clock.timestamp?.seconds);
  const nanos = Number(clock.timestamp?.nanos);
  const milliseconds = seconds * 1000 + nanos / 1000000;

  return {
    block_number: Number(clock.number),
    block_id: clock.id,
    seconds,
    milliseconds,
    nanos,
    timestamp: parseTimestamp(clock.timestamp)
  }
}

export function parseTimestamp(timestamp: Timestamp) {
  return timestamp.toDate().toISOString().replace("T", " ").split(".")[0]
}