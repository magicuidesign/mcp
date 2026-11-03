import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const EXPECTED_TOOLS = ["getRegistryItem", "listRegistryItems", "searchRegistryItems"];
const TIMEOUT_MS = 15_000;

const server = spawn(process.execPath, ["dist/server.js"], {
  stdio: ["pipe", "pipe", "inherit"],
});

const pending = new Map();
createInterface({ input: server.stdout }).on("line", (line) => {
  const message = JSON.parse(line);
  pending.get(message.id)?.(message);
});

const send = (message) => server.stdin.write(`${JSON.stringify(message)}\n`);
const request = (id, method, params) =>
  new Promise((resolve) => {
    pending.set(id, resolve);
    send({ jsonrpc: "2.0", id, method, params });
  });

const timer = setTimeout(() => fail(`no response within ${TIMEOUT_MS}ms`), TIMEOUT_MS);

function fail(reason) {
  console.error(`smoke test failed: ${reason}`);
  server.kill();
  process.exit(1);
}

const init = await request(1, "initialize", {
  protocolVersion: "2025-03-26",
  capabilities: {},
  clientInfo: { name: "smoke-test", version: "0.0.0" },
});
if (init.error) fail(`initialize returned ${JSON.stringify(init.error)}`);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

const list = await request(2, "tools/list", {});
if (list.error) fail(`tools/list returned ${JSON.stringify(list.error)}`);

const names = list.result.tools.map((tool) => tool.name).sort();
if (JSON.stringify(names) !== JSON.stringify(EXPECTED_TOOLS)) {
  fail(`expected tools ${EXPECTED_TOOLS.join(", ")}, got ${names.join(", ")}`);
}

clearTimeout(timer);
server.kill();
console.log(`smoke test passed: ${names.join(", ")}`);
