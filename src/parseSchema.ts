export function parseSchema(sql: string) {
    const tables = new Map<string, string[]>(); // <table, columns>
    const statements = sql.split(";")

    // should return `block_meta` as table and `id, at, number, hash, parent_hash, timestamp` as columns
    for (const statement of statements) {
        const lines = statement.trim().split("\n");
        const table = parseCreateTable(lines[0]);
        // console.log(table, lines);
        if ( !table ) continue;
        const columns = new Set<string>();
        for ( const line of lines) {
            const column = parseColumn(line);
            if (column) columns.add(column);
        }
        tables.set(table, Array.from(columns));
    }
    return tables;
}

// must match the following statements:
// CREATE TABLE block_meta
// CREATE TABLE block_meta (
// create table block meta
// CREATE TABLE IF NOT EXISTS block_meta
export function parseCreateTable(statement: string) {
    const match = statement.match(/^CREATE TABLE/i);
    if (match) {
        statement = statement.replace("(", "").trim();
        return statement.split(" ").reverse()[0].trim();
    }
    return '';
}

// must match the following statements:
// id INTEGER PRIMARY KEY,
// parent_hash TEXT,
// timestamp INTEGER
export function parseColumn(statement: string) {
    statement = statement.trim().replace(/[,;]/g, ''); // remove trailing comma or semicolon
    statement = statement.replace(/[\"\']/g, ''); // remove quotes
    if ( statement.match(/^CREATE TABLE/i) ) return '' // ignore table name
    if ( statement.match(/^PRIMARY KEY/i) ) return '' // ignore primary key as valid column
    if ( statement.match(/^\)/) ) return '' // ignore closing parenthesis
    if ( statement.match(/^\s*$/) ) return '' // ignore empty lines
    if ( statement.match(/^CONSTRAINT/i) ) return '' // ignore constraints
    const words = statement.split(" ");
    if ( words.length > 1) {
        return words[0].trim();
    }
    return '';
}