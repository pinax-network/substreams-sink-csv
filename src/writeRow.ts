import fs from "fs";

interface WriteRowOptions {
    delimiter: string;
}

export function writeRow(writer: fs.WriteStream, columns: any[], options: WriteRowOptions): void {
    columns = columns.map(value => formatValue(value, options));
    writer.write(columns.join(options.delimiter) + '\n');
}

export function formatValue(value: string|undefined|null, options: WriteRowOptions): string {
    if (value === undefined || value === null) return "";

    if (typeof value == "string") {
        value = value.replace(/"/g, "\"\"")
        if ( value.includes(options.delimiter) ) value = `"${value}"`; // escape commas
    }
    return value;
}