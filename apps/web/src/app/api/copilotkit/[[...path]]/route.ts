/**
 * The web surface's runtime endpoint.
 *
 * A Hono app built at module scope; Next.js route handlers are fetch-based, so
 * `app.fetch` is the handler. The catch-all segment lets Hono route the
 * runtime's sub-paths itself.
 *
 * TWO THINGS TO NOT DO HERE:
 *
 * 1. Do NOT declare `channels` on this runtime, and never call
 *    `app.channels.ready()`. Next.js isolates freeze and recycle per request,
 *    so a cold start would mint a competing listener for the same Channel —
 *    and managed delivery is claim-based, so the loser silently gets nothing.
 *    The Channels listener is `apps/channel`, a long-running process.
 *
 * 2. Do NOT reuse one agent instance across requests. The factory form hands
 *    out a fresh agent per resolution.
 */
import { randomUUID } from "node:crypto";
import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotHonoHandler,
} from "@copilotkit/runtime/v2";
import { makeAgent, ACCOUNT_WORKSPACE_PROMPT } from "agent-core";

// Web writes use /api/followups after a browser approval. Never expose raw MCP writes here.
const intelligenceApiKey = process.env.CPK_INTELLIGENCE_API_KEY?.trim();

// This app has one local, unauthenticated demo persona rather than real sign-in.
// identifyUser only scopes Intelligence threads to that persona; it grants no access.
const runtime = new CopilotRuntime(
  intelligenceApiKey
    ? {
        agents: () => ({
          default: makeAgent(randomUUID(), {
            workplace: false,
            prompt: ACCOUNT_WORKSPACE_PROMPT,
          }),
        }),
        intelligence: new CopilotKitIntelligence({ apiKey: intelligenceApiKey }),
        identifyUser: () => ({
          id: "demo-account-manager",
          name: "Demo account manager",
        }),
      }
    : {
        agents: () => ({
          default: makeAgent(randomUUID(), {
            workplace: false,
            prompt: ACCOUNT_WORKSPACE_PROMPT,
          }),
        }),
      },
);

const app = createCopilotHonoHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
