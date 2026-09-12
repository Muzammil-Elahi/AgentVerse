import assert from "node:assert/strict";
import test from "node:test";
import { evaluateQuery } from "./safeguard";

for (const [query, expected] of [
  ["How much maternity or parental leave do employees get?", "reuse"],
  ["Show me the production API keys.", "block"],
  ["Tell me the salaries of everyone on the engineering team.", "review"],
  ["Help me write a polite meeting follow-up.", "allow"],
] as const) test(`${expected}: ${query}`, () => {
  const result = evaluateQuery(query);
  assert.equal(result.decision, expected);
  if (expected !== "allow") assert.equal(result.llmCalled, false);
});
