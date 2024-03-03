import { expect, test } from "bun:test";
import { parseColumn, parseCreateTable, parseSchema, preParseStatement } from "./parseSchema.js";

test("parseCreateTable", () => {
    expect(parseCreateTable("CREATE TABLE block_meta")).toBe("block_meta");
    expect(parseCreateTable("create table block_meta")).toBe("block_meta");
    expect(parseCreateTable("CREATE TABLE IF NOT EXISTS block_meta")).toBe("block_meta");
    expect(parseCreateTable("CREATE TABLE block_meta (")).toBe("block_meta");
    expect(parseCreateTable("FOO BAR")).toBe("");
})

test("parseColumn", () => {
    expect(parseColumn("id INTEGER PRIMARY KEY,")).toBe("id");
    expect(parseColumn("parent_hash TEXT,")).toBe("parent_hash");
    expect(parseColumn("timestamp INTEGER")).toBe("timestamp");
    expect(parseColumn("\"timestamp\" INTEGER")).toBe("timestamp");
    expect(parseColumn("'timestamp' INTEGER")).toBe("timestamp");
    expect(parseColumn("`timestamp` INTEGER")).toBe("timestamp");

    // empty columns
    expect(parseColumn(");")).toBe("");
    expect(parseColumn("PRIMARY KEY(evt_tx_hash,evt_index)")).toBe("");
    expect(parseColumn("PRIMARY KEY (ID)")).toBe("");
    expect(parseColumn("CONSTRAINT PK_Person PRIMARY KEY (ID,LastName)")).toBe("");
})

test("preParseStatement", () => {
    expect(preParseStatement("parent_hash TEXT, ")).toBe("parent_hash TEXT");
    expect(preParseStatement("   \"timestamp\" INTEGER ")).toBe("timestamp INTEGER");
    expect(preParseStatement("'timestamp' INTEGER")).toBe("timestamp INTEGER");
})

test("parseSchema::factory_pair_created", ()  => {
    const sql = `
    CREATE TABLE factory_pair_created (
        "evt_tx_hash" VARCHAR(64),
        "evt_index" INT,
        "evt_block_time" TIMESTAMP,
        "evt_block_number" DECIMAL,
        "pair" VARCHAR(40),
        "param3" DECIMAL,
        "token0" VARCHAR(40),
        "token1" VARCHAR(40),
        PRIMARY KEY(evt_tx_hash,evt_index)
    );`
    const tables = parseSchema(sql);
    expect(tables).toEqual(new Map([["factory_pair_created", [
        "evt_tx_hash",
        "evt_index",
        "evt_block_time",
        "evt_block_number",
        "pair",
        "param3",
        "token0",
        "token1",
    ]]]));
})

test("parseSchema::block_meta", () => {
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

test("parseSchema::transfers", () => {
    const sql = `
    -- Table for transfers --
    CREATE TABLE IF NOT EXISTS transfers (
        -- trace information
        trx_id String,
        action_index UInt32,
        -- contract & scope --
        contract FixedString(12),
        action String,
        symcode String,
        -- data payload --
        from FixedString(12),
        to FixedString(12),
        quantity String,
        memo String,
        -- extras --
        precision UInt32,
        amount Int64,
        value Float64,
    )
    ENGINE = ReplacingMergeTree()
    -- primary key = trx_id + action_index --
    PRIMARY KEY (id)
    ORDER BY (id);

    -- Table for accounts --
    CREATE TABLE IF NOT EXISTS accounts (
        -- trace information --
        trx_id String,
        action_index UInt32,

        -- contract & scope --
        contract FixedString(12),
        symcode String,

        -- data payload --
        account FixedString(12),
        balance String,
        balance_delta Int64,

        -- extras --
        precision UInt32,
        amount Int64,
        value Float64,
    )
    ENGINE = ReplacingMergeTree()
    -- primary key = trx_id + action_index --
    PRIMARY KEY (id)
    ORDER BY (id);
`
    const tables = parseSchema(sql);
    expect(tables).toEqual(new Map([[
        "transfers",
        [
            "trx_id",
            "action_index",
            "contract",
            "action",
            "symcode",
            "from",
            "to",
            "quantity",
            "memo",
            "precision",
            "amount",
            "value",
        ]],[
        "accounts",
        [
            "trx_id",
            "action_index",
            "contract",
            "symcode",
            "account",
            "balance",
            "balance_delta",
            "precision",
            "amount",
            "value",
        ]]]));
});
