import { expect, test } from "bun:test";
import { parseTimestamp } from "./parseClock.js";
import { Timestamp } from "@bufbuild/protobuf";

test("parseTimestamp", () => {
    // expect(parseTimestamp(timestamp)).toBe("2015-07-30T15:26:57.000Z");
    expect(parseTimestamp(Timestamp.fromDate(new Date(1438270017000)))).toBe("2015-07-30 15:26:57");
})
