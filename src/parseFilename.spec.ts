import { expect, test } from "bun:test";
import { parseNetwork } from "./parseFilename.js";

test("parseNetwork", () => {
    expect(parseNetwork("mainnet.eth.streamingfast.io:443")).toBe("mainnet.eth.streamingfast.io");
    expect(parseNetwork("http://mainnet.eth.streamingfast.io:443")).toBe("mainnet.eth.streamingfast.io");
    expect(parseNetwork("https://mainnet.eth.streamingfast.io:443")).toBe("mainnet.eth.streamingfast.io");
    expect(parseNetwork("http://eth-sfst79.mar.eosn.io:9000")).toBe("eth-sfst79.mar.eosn.io");
})
