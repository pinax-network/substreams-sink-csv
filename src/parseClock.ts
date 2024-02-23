import { Clock } from "@substreams/core/proto";

export function parseClock(clock: Clock) {
    if ( !clock.timestamp ) throw new Error("Clock has no timestamp");
    return {
      block_num: Number(clock.number),
      block_id: clock.id,
      seconds: Number(clock.timestamp?.seconds),
      timestamp: clock.timestamp?.toDate().toISOString(),
    }
  }