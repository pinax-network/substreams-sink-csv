import { expect, test } from "bun:test";
import { isRemotePath } from "./isRemotePath.js";

test("isRemotePath", () => {
    expect(isRemotePath("https://github.com/streamingfast/substreams-eth-block-meta/releases/download/v0.5.1/substreams-eth-block-meta-v0.5.1.spkg")).toBe(true);
    expect(isRemotePath("substreams-eth-block-meta-v0.5.1.spkg")).toBe(false);
    expect(isRemotePath("./substreams-eth-block-meta-v0.5.1.spkg")).toBe(false);
})
