import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");

async function page(path: string): Promise<Document> {
  const res = await fetch(new URL(path, baseUrl));
  expect(res.status).toBe(200);
  return new JSDOM(await res.text()).window.document;
}

function nameOf(doc: Document, el: Element): string {
  const aria = el.getAttribute("aria-label") ?? "";
  const labelled = el.getAttribute("aria-labelledby");
  const byId = labelled ? doc.getElementById(labelled)?.textContent ?? "" : "";
  const id = el.getAttribute("id");
  const label = id ? doc.querySelector(`label[for="${id}"]`)?.textContent ?? "" : "";
  return `${aria}${byId}${label}${el.textContent ?? ""}`.trim();
}

describe.each(["/", "/readme/"])("the page at %s", (path) => {
  it("declares its language, has one h1, and a banner, a main and a named nav", async () => {
    const doc = await page(path);
    expect(doc.documentElement.getAttribute("lang")).toMatch(/^en/);
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelector("header")).not.toBeNull();
    expect(doc.querySelector("main")).not.toBeNull();
    const nav = doc.querySelector("nav");
    expect(nav?.getAttribute("aria-label")).toBeTruthy();
  });

  it("names every button, link, input and image", async () => {
    const doc = await page(path);
    for (const el of doc.querySelectorAll("button, a[href]")) expect(nameOf(doc, el), el.outerHTML.slice(0, 80)).not.toBe("");
    for (const el of doc.querySelectorAll("input, textarea, select")) expect(nameOf(doc, el), el.outerHTML.slice(0, 80)).not.toBe("");
    for (const img of doc.querySelectorAll("img")) expect(img.hasAttribute("alt"), img.outerHTML.slice(0, 80)).toBe(true);
  });
});

describe("the harbour", () => {
  it("describes the canvas, announces what changes, and shows where keyboard focus is", async () => {
    const doc = await page("/");
    const canvas = doc.querySelector("canvas#view");
    expect(canvas?.getAttribute("aria-label")).toMatch(/E to board/);
    expect(canvas?.getAttribute("tabindex")).toBe("0");
    for (const id of ["toast", "status", "hint"]) expect(doc.getElementById(id)?.getAttribute("aria-live"), id).toBe("polite");
    expect(readFileSync("public/style.css", "utf8")).toMatch(/:focus-visible\s*\{[^}]*(outline|box-shadow)/);
  });
});
