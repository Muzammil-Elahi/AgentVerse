"use client";

import { useFrontendTool, useAgentContext } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { findAccount, workspaceContext } from "@/lib/accounts";
import type { WorkplaceControls } from "@/lib/use-workplace";

async function toolResult<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Workplace operation failed. Check the page for setup details.",
    };
  }
}

export function AppControl({
  selectedId,
  selectAccount,
  workplace,
}: {
  selectedId: string;
  selectAccount: (id: string) => void;
  workplace: WorkplaceControls;
}) {
  const { status, propose, retrieve } = workplace;

  useAgentContext({
    description:
      "The customer account workspace currently visible to the user, including sample touchpoint history and Ambiguous follow-ups. CRITICAL: propose_followup only prepares a proposal. Only the user's approval button saves it; prose/chat approval never executes a write. Use retrieve_followup or refresh_followups for real reads. Never claim a task was saved without a provider record. Never invent record links.",
    value: {
      ...workspaceContext(
        selectedId,
        status?.status === "connected" ? status.tasks : [],
      ),
      workplace: status?.status ?? "unavailable",
      workplaceError: workplace.error,
      proposal: workplace.proposal ?? null,
      lastResult: workplace.notice,
    },
  });

  useFrontendTool(
    {
      name: "select_account",
      description:
        "Open an existing sample account in the workspace. Use an ID from availableAccounts.",
      parameters: z.object({ accountId: z.string() }),
      handler: async ({ accountId }) => {
        const account = findAccount(accountId);
        selectAccount(account.id);
        return `Opened ${account.id}: ${account.name}. The visible details and agent context now show this account.`;
      },
    },
    [selectAccount],
  );

  useFrontendTool(
    {
      name: "propose_followup",
      description:
        "Prepare an Ambiguous task from the selected account context. Show the exact title and details for the user's approval button. Does not save anything. CRITICAL: wait for the user to click Approve & save to Ambiguous in the page.",
      parameters: z.object({
        accountId: z.string(),
        title: z.string().trim().min(1).max(200),
        details: z.string().trim().min(1).max(4000),
      }),
      handler: async (draft) =>
        toolResult(async () => ({
          status: "pending_approval",
          proposal: await propose(draft),
        })),
    },
    [propose],
  );

  useFrontendTool(
    {
      name: "retrieve_followup",
      description:
        "Retrieve an existing Ambiguous task by its actual ID. Read-only; never creates a duplicate.",
      parameters: z.object({ id: z.uuid() }),
      handler: async ({ id }) => toolResult(() => retrieve(id)),
    },
    [retrieve],
  );

  useFrontendTool(
    {
      name: "refresh_followups",
      description:
        "Read saved follow-ups for the currently selected account from Ambiguous. Use after approval or browser refresh to verify persistence.",
      parameters: z.object({}),
      handler: async () => toolResult(() => workplace.refresh()),
    },
    [workplace.refresh],
  );

  return null;
}
