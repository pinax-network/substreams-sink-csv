CREATE TABLE accounts
(
    id              TEXT,
    trx_id          TEXT,
    action_index    TEXT,
    contract        TEXT,
    symcode         TEXT,
    account         TEXT,
    balance         TEXT,
    balance_delta   TEXT,
    precision       TEXT,
    amount          TEXT,
    value           TEXT,
);

CREATE TABLE stats
(
    id              TEXT,
    trx_id          TEXT,
    action_index    TEXT,
    contract        TEXT,
    symcode         TEXT,
    issuer          TEXT,
    max_supply      TEXT,
    supply          TEXT,
    supply_delta    TEXT
    precision       TEXT,
    amount          TEXT,
    value           TEXT,
);

CREATE TABLE transfers
(
    id              TEXT,
    trx_id          TEXT,
    action_index    TEXT,
    contract        TEXT,
    action          TEXT,
    symcode         TEXT,
    from            TEXT,
    to              TEXT,
    memo            TEXT,
    quantity        TEXT,
    precision       TEXT,
    amount          TEXT,
    value           TEXT,
    timestamp      TEXT,
    block_num      TEXT,
);