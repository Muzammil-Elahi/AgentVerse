import assert from "node:assert/strict";
import test from "node:test";
import { findAccount, workspaceContext } from "./accounts";
import type { WorkplaceTask } from "./followup-types";

test("selection changes the shared account and timeline together", () => {
  const northwind = workspaceContext("ACC-2041", []);
  const solara = workspaceContext("ACC-2058", []);
  assert.equal(northwind.selectedAccount.plan, "Growth");
  assert.equal(solara.selectedAccount.plan, "Scale");
  assert.match(solara.selectedAccount.timeline[0].detail, /SSO/);
  assert.equal(solara.availableAccounts.length, 2);
});

test("workspace context labels sample accounts and provider follow-ups", () => {
  const tasks: WorkplaceTask[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Schedule executive check-in",
      description: "Provider task details\nagents-everywhere:ACC-2041",
      url: null,
    },
  ];
  const context = workspaceContext("ACC-2041", tasks);
  assert.throws(() => findAccount("unknown"), /Unknown account/);
  assert.match(context.dataSource, /Fictional sample/);
  assert.match(context.dataSource, /Ambiguous/);
  assert.deepEqual(context.followups, tasks);
});
