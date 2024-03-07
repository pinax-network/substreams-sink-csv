CREATE TABLE Blob
(
    id                              TEXT,
    slot                            TEXT,
    index                           TEXT,
    blob                            TEXT,
    kzg_commitment                  TEXT,
    kzg_proof                       TEXT,
    kzg_commitment_inclusion_proof  TEXT[],
);

CREATE TABLE Slot
(
    id                  TEXT,
    number              BIGINT,
    spec                TEXT,
    proposer_index      INT,
    parent_root         TEXT,
    state_root          TEXT,
    body_root           TEXT,
    signature           TEXT,
    timestamp           TEXT,
);
