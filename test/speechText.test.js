import assert from "node:assert/strict";
import test from "node:test";
import { splitSpeechText } from "../src/speechText.js";

test("splits long text into chunks within the service limit", () => {
  const text = "Xin chào mọi người. ".repeat(400);
  const chunks = splitSpeechText(text);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => Array.from(chunk).length <= 1800));
  assert.equal(
    chunks.join(" ").replace(/\s+/g, " ").trim(),
    text.replace(/\s+/g, " ").trim(),
  );
});

test("splits an uninterrupted long string without exceeding the limit", () => {
  const text = "x".repeat(4000);
  const chunks = splitSpeechText(text);

  assert.ok(chunks.every((chunk) => Array.from(chunk).length <= 1800));
  assert.equal(chunks.join(""), text);
});
