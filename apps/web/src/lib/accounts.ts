/** Sample account context. Follow-ups are retrieved separately from Ambiguous. */
import type { WorkplaceTask } from "./followup-types";

export const accounts = [
  {
    id: "ACC-2041",
    name: "Northwind Logistics",
    plan: "Growth",
    mrr: "$4,200/mo",
    healthScore: "58 / 100",
    status: "At risk",
    renewalDate: "2026-10-03",
    owner: "Dana Whitfield",
    primaryContact: "Priya Anand, VP Operations",
    updated: "09:24 UTC",
    summary:
      "Usage dropped 30% after a support escalation last month. No executive follow-up since the ticket closed.",
    opportunity:
      "Renewal is worth $50,400 ARR. The contract auto-renews unless either side opts out 30 days prior — that window opens in 3 days.",
    timeline: [
      {
        time: "08 Sep",
        author: "Support",
        detail: "P1 ticket: bulk export failing for the warehouse team.",
      },
      {
        time: "10 Sep",
        author: "Dana Whitfield",
        detail: "Ticket resolved; no executive follow-up sent.",
      },
      {
        time: "12 Sep",
        author: "Usage monitor",
        detail: "Weekly active seats down from 42 to 29.",
      },
    ],
  },
  {
    id: "ACC-2058",
    name: "Solara Health",
    plan: "Scale",
    mrr: "$11,800/mo",
    healthScore: "88 / 100",
    status: "Expansion opportunity",
    renewalDate: "2026-11-18",
    owner: "Dana Whitfield",
    primaryContact: "Marcus Oduya, Director of Ops",
    updated: "09:31 UTC",
    summary:
      "Seat usage is up 40% quarter over quarter. The team has asked about the analytics add-on twice in support chat.",
    opportunity:
      "Upsell potential on the analytics add-on: +$3,200/mo. No proposal has been sent yet.",
    timeline: [
      {
        time: "05 Sep",
        author: "Support",
        detail: "Asked whether the analytics add-on works with their SSO setup.",
      },
      {
        time: "09 Sep",
        author: "Marcus Oduya",
        detail: "Requested a pricing walkthrough on the add-on.",
      },
      {
        time: "11 Sep",
        author: "Usage monitor",
        detail: "Weekly active seats up from 64 to 90.",
      },
    ],
  },
] as const;

export type Account = (typeof accounts)[number];

export function findAccount(id: string): Account {
  const account = accounts.find((item) => item.id === id);
  if (!account)
    throw new Error(
      `Unknown account ${id}. Choose ${accounts.map((item) => item.id).join(" or ")}.`,
    );
  return account;
}

export function workspaceContext(
  selectedId: string,
  followups: WorkplaceTask[],
) {
  return {
    dataSource:
      "Fictional sample customer accounts. Follow-ups shown here were retrieved from Ambiguous for the selected account. A proposal is not a saved task.",
    availableAccounts: accounts.map(({ id, name, status }) => ({
      id,
      name,
      status,
    })),
    selectedAccount: {
      ...findAccount(selectedId),
      timeline: [...findAccount(selectedId).timeline],
    },
    followups,
  };
}
