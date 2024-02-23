export const default_columns = ["block_num", "timestamp", "id"];

export function parseSchema(sql: string) {
    const tables = new Map<string, string[]>(); // <table, columns>
    const statements = sql.split(";");

    // should return `block_meta` as table and `id, at, number, hash, parent_hash, timestamp` as columns
    for (const statement of statements) {
        const match = statement.match(/CREATE TABLE (\w+)/);
        if (match) {
            const table = match[1];
            const columns = new Set<string>(default_columns); // use Set to avoid duplicates
            const columnMatches = statement.match(/\(([\w\s,]+)\)/);
            if (columnMatches) {
                const columnNames = columnMatches[1].split(",");
                for (const columnName of columnNames) {
                    columns.add(columnName.trim().split(/[ ]+/)[0]);
                }
            }
            tables.set(table, Array.from(columns));
        }
    }
    return tables;
}
