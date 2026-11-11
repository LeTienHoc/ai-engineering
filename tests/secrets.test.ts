import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSecrets } from "../tools/lib/secrets.ts";

test("sk- style key is detected", () => {
  const issues = scanSecrets("key = sk-" + "a1B2c3D4e5F6g7H8i9J0k1");
  assert.ok(issues.some((i) => i.code === "SECRET"));
});

test("AWS, GitHub and private key patterns are detected", () => {
  assert.ok(scanSecrets("AKIA" + "ABCDEFGHIJKLMNOP").length > 0);
  assert.ok(scanSecrets("ghp_" + "a".repeat(36)).length > 0);
  assert.ok(scanSecrets("-----BEGIN " + "RSA PRIVATE KEY-----").length > 0);
});

test("assignment of a literal password is detected", () => {
  assert.ok(scanSecrets('password = "hunter2hunter2"').length > 0);
});

test("normal prose mentioning token or secret is not flagged", () => {
  assert.deepEqual(scanSecrets("The refresh token is stored server-side. Never print a secret."), []);
});
