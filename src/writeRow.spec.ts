import { expect, test } from "bun:test";
import { formatValue } from "./writeRow.js";

test("formatValue", () => {
    const options = {delimiter: ","};
    expect(formatValue("a", options)).toBe("a");
    expect(formatValue("'a'", options)).toBe("'a'");
    expect(formatValue("foo bar", options)).toBe("foo bar");
    expect(formatValue("foo \" bar", options)).toBe("foo \"\" bar");
    expect(formatValue(undefined, options)).toBe("");
    expect(formatValue(null, options)).toBe("");
    expect(formatValue("0", options)).toBe("0");
    expect(formatValue("a,b", options)).toBe("\"a,b\"");
    expect(formatValue("a,\"b", options)).toBe("\"a,\"\"b\"");

    // Array
    expect(formatValue(["ab", "cd"], options)).toBe("\"[\"\"ab\"\",\"\"cd\"\"]\"");
})

test.skip("formatValue - recursive array", () => {
    // https://github.com/substreams-js/substreams-sink-entity-changes/issues/5
});