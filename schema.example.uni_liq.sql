CREATE TABLE position_liquidity
(
    block_num   BIGINT,
    timestamp   TIMESTAMP,
    id          TEXT,
    liquidity    BIGINT,
);

CREATE TABLE pool
(
    block_num   BIGINT,
    timestamp   TIMESTAMP,
    id          TEXT,
    token0_address    TEXT,
    token0_symbol    TEXT,
    token0_decimals    TEXT,
    token1_address    TEXT,
    token1_symbol    TEXT,
    token1_decimals    TEXT,
);