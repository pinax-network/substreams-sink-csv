export function parseSchema(sql: string) {
    const tables = new Map<string, string[]>(); // <table, columns>
    const statements = sql.split(";")

    for (let statement of statements) {
        statement = preParseStatement(statement);
        const lines = statement.trim().split("\n");
        const columns = new Set<string>();
        let table = '';
        for ( const line of lines) {
            const parsedTable = parseCreateTable(line);
            if ( parsedTable ) table = parsedTable;
            if ( !table ) continue;
            const column = parseColumn(line);
            if (column) columns.add(column);
        }
        if ( table ) tables.set(table, Array.from(columns));
    }
    return tables;
}

// must match the following statements:
// CREATE TABLE block_meta
// CREATE TABLE block_meta (
// create table block meta
// CREATE TABLE IF NOT EXISTS block_meta
export function parseCreateTable(statement: string) {
    statement = preParseStatement(statement);
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
    statement = preParseStatement(statement);
    if ( statement.match(/^CREATE TABLE/i) ) return '' // ignore table name
    if ( statement.match(/^PRIMARY KEY/i) ) return '' // ignore primary key as valid column
    if ( statement.match(/^\)/) ) return '' // ignore closing parenthesis
    if ( statement.match(/^\s*$/) ) return '' // ignore empty lines
    if ( statement.match(/^CONSTRAINT/i) ) return '' // ignore constraints
    if ( statement.match(/^ENGINE/i) ) return '' // ignore engine
    if ( statement.match(/^ORDER BY/i) ) return '' // ignore engine
    if ( statement.match(/^--/i) ) return '' // ignore comments
    const words = statement.split(" ");
    if ( words.length > 1) {
        return words[0].trim();
    }
    return '';
}

// remove trailing comma or semicolon
// remove quotes
export function preParseStatement(statement: string) {
    return statement
        .replace(/[,;\'\"`]/g, '')
        .trim()
}