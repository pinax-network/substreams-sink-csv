import { describe, expect, test } from "bun:test";
import { parseSchema } from "./parseSchema.js";

test("parseSchema", () => {
    const sql = `
    CREATE TABLE block_meta
    (
        id          TEXT NOT NULL CONSTRAINT block_meta_pk PRIMARY KEY,
        at          TIMESTAMP,
        number      BIGINT,
        hash        TEXT,
        parent_hash TEXT,
        timestamp   TIMESTAMP
    );`
    const tables = parseSchema(sql);
    expect(tables).toEqual(new Map([["block_meta", ["id", "at", "number", "hash", "parent_hash", "timestamp"]]]));
});