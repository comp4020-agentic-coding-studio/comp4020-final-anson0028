import WebSocket from "ws";
import { afterEach, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { settle, uuid } from "./walker.ts";

let island: Island | null = null;
afterEach(async () => {
  await island?.stop();
  island = null;
});

async function fresh(): Promise<Island> {
  island = new Island();
  await island.start({ WALK_TEST: "1" });
  return island;
}

async function alive(isl: Island): Promise<boolean> {
  try {
    return (await fetch(`${isl.url}/health`)).ok;
  } catch {
    return false;
  }
}

function open(isl: Island, token: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${isl.wsBase}/ws?token=${token}`);
    ws.once("message", () => resolve(ws));
    ws.once("error", reject);
  });
}

describe("one visitor", { timeout: 30000 }, () => {
  it("can't take the server down with a request for a directory", async () => {
    const isl = await fresh();
    for (const path of ["/vendor/", "/vendor", "/vendor/../vendor/"]) {
      const res = await fetch(`${isl.url}${path}`);
      expect(res.status, path).toBe(404);
    }
    expect(await alive(isl)).toBe(true);
  });

  it("can't take the server down with a message that isn't an object", async () => {
    const isl = await fresh();
    const ws = await open(isl, uuid("aaaa0301"));
    for (const raw of ["null", "42", '"text"', "[]", "true", "{", "{\"t\":null}"]) ws.send(raw);
    await settle(400);
    expect(await alive(isl)).toBe(true);
    ws.close();
  });

  it("is cut off for a message far larger than any the page sends, and the server stays up", async () => {
    const isl = await fresh();
    const ws = await open(isl, uuid("aaaa0302"));
    const closed = new Promise<number>((resolve) => ws.once("close", (code) => resolve(code)));
    ws.send(JSON.stringify({ t: "say", text: "x".repeat(64 * 1024) }));
    expect(await closed).toBe(1009);
    expect(await alive(isl)).toBe(true);
  });
});
