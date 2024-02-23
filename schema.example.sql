CREATE TABLE block_meta
(
    id          TEXT NOT NULL CONSTRAINT block_meta_pk PRIMARY KEY,
    at          TIMESTAMP,
    number      BIGINT,
    hash        TEXT,
    parent_hash TEXT,
    timestamp   TIMESTAMP
);