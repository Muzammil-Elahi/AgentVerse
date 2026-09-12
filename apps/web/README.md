# An agent inside your web app

**OpenAI/OpenRouter + CopilotKit React (+ Intelligence) + Ambiguous AI**

Build an agent that sees the selected record or page, helps the user act on it, and creates a workplace record that remains after a refresh. This checkout adapts the starter's sample incident domain to a **renewal desk**: an account manager reviews a customer account approaching renewal, asks the assistant what needs attention, and turns that into a real follow-up task saved to Ambiguous.

[![Web app agent demo](../../assets/demos/web.gif)](../../assets/demos/web.mp4)

_Ask for a follow-up, approve it, and reload to find the saved task in Ambiguous. Preview at 3× speed; click for the full MP4._

## Get started

Complete the [root clone/install steps](../../README.md#get-started). Configure `.env` with [OpenAI](../../using-sponsor-tools.md#openai) and [Ambiguous AI](../../using-sponsor-tools.md#ambiguous-ai):

```dotenv
MODEL_PROVIDER=openai
OPENAI_API_KEY=your-key
MODEL=gpt-5.6-sol
AMBIGUOUS_API_KEY=your-workspace-key
```

Choose an OpenAI model your account can use. Use a demo workspace you control for the first write. This web template needs no managed Channel or Intelligence account.

To add managed conversation persistence, use the [official Intelligence onboarding prompt](../../README.md#copilotkit-onboarding) with `apps/web` as the selected app. It connects this existing Next.js/CopilotKit app; keep the Ambiguous record workflow and page approval. Saving a task in Ambiguous and persisting a conversation in Intelligence are separate capabilities.

**This checkout is already connected to Intelligence.** `CPK_INTELLIGENCE_API_KEY` lives in root `.env`; `src/app/api/copilotkit/[[...path]]/route.ts` constructs `CopilotRuntime` with an `intelligence` client and an `identifyUser` callback (a single fixed demo persona — this app has no real sign-in) when that key is present, and falls back to the plain OSS runner when it is not. `src/app/page.tsx` wraps the chat in `CopilotChatConfigurationProvider` and renders `<CopilotThreadsDrawer />` so saved threads are visible in the page. Run `npx --yes copilotkit@latest verify --expect-runtime intelligence --round-trip --agent default --runtime-url http://127.0.0.1:3100/api/copilotkit --json` against a running `npm run dev:web` to re-prove the round trip after any change.

To use OpenRouter, follow the [shared provider settings](../../using-sponsor-tools.md#openrouter): set `MODEL_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, and a `MODEL` slug with tool support. Keep the Ambiguous workspace key; an OpenAI key is not required for OpenRouter chat.

```bash
npm run dev:web
```

Open `http://127.0.0.1:3100` or `http://localhost:3100` and select an incident. The dev and start scripts bind the credential-backed approval server to loopback by default; keep that boundary unless you add your own authentication and trusted-origin policy.

## Try the flow

1. Ask: “What's happening with this account?” Check the answer against the account currently selected.
2. Ask: “Create a follow-up for this account.”
3. Review the page proposal. Click **Approve & save to Ambiguous** only if the fields are correct. The app should return the actual record ID and any provider link.
4. Refresh the browser. Ask the agent to retrieve the saved task by its ID from Ambiguous, or click **Refresh from Ambiguous**. Check the same record returns without creating a duplicate.
5. Repeat with **Decline** and confirm no task is created.

The result should be a retrievable Ambiguous record with the same ID after refresh. An assistant message saying it saved something is not sufficient.

## Customize these files

| Piece | File |
| --- | --- |
| App and selected record | [src/app/page.tsx](src/app/page.tsx) and [src/lib/accounts.ts](src/lib/accounts.ts) |
| Context and frontend tools | [src/components/app-control.tsx](src/components/app-control.tsx): `useAgentContext`, `select_account`, `propose_followup`, `retrieve_followup`, and `refresh_followups` |
| Approval UI and provider reads | [src/components/workplace-followups.tsx](src/components/workplace-followups.tsx) and [src/lib/use-workplace.ts](src/lib/use-workplace.ts) |
| Server approval boundary | [src/app/api/followups/route.ts](src/app/api/followups/route.ts) and [src/lib/server/followups.ts](src/lib/server/followups.ts) |
| Ambiguous MCP adapter | [src/lib/server/workplace.ts](src/lib/server/workplace.ts), reads workspace context and saves approved tasks |
| CopilotKit React UI | [src/components/generative-ui.tsx](src/components/generative-ui.tsx) and [src/components/providers.tsx](src/components/providers.tsx) |
| Agent system prompt | [packages/agent-core/src/account-workspace-prompt.ts](../../packages/agent-core/src/account-workspace-prompt.ts) |
| Agent endpoint | [src/app/api/copilotkit/[[...path]]/route.ts](src/app/api/copilotkit/[[...path]]/route.ts), configured without raw workplace write tools; adds the `intelligence` client + `identifyUser` only when `CPK_INTELLIGENCE_API_KEY` is set |

The web chat does not receive raw Ambiguous write tools. It can propose a task and read or refresh existing records through frontend tools; the server writes only after the user clicks **Approve & save to Ambiguous**. Tool schemas come from the MCP server at write time, and returned links must come from Ambiguous rather than being invented.

## Give this to your coding agent

```text
Read the root hackathon overview, rules, sponsor guide, and AGENTS.md.
Explain the model-only and Intelligence options in README.md's CopilotKit
onboarding section. If I choose Intelligence, follow its official onboarding
prompt for apps/web before customizing; preserve this existing integration.
Adapt apps/web to our user and workflow. Keep CopilotKit React for page context,
frontend tools, agent-rendered UI, and page approval. Use Ambiguous AI for
persistent records. Do not expose raw write tools to the web chat when the page
approval path is required. Return the real record ID/link and verify read-back
after refresh. Keep credentials server-side and enforce authorization at the
write boundary. Run npm run verify and npm run build --workspace web, then
document the live record create/read/decline checks.
```

## Verify and limits

Run `npm run verify` and `npm run build --workspace web` for local checks. Then try the create/read/decline flow with your own workspace. Offline tests cover the approval boundary and error handling; they do not make live provider calls.

### Live checks performed on this checkout (2026-09-12)

Run against `npm run dev:web` with real `AMBIGUOUS_API_KEY` and `CPK_INTELLIGENCE_API_KEY` credentials, driving the same `/api/followups` boundary the page's buttons call:

- **Identity** — `GET /api/users/me` on Ambiguous confirmed the workspace before any write.
- **Create** — Proposed and approved a follow-up for `ACC-2041` (Northwind Logistics). Ambiguous returned real task id `5f42a6b7-ea54-4bc1-a1aa-2362209f22a8` (no provider URL for this task; the app reports that honestly instead of inventing one).
- **Read-back after refresh** — A fresh session (new cookie, simulating a browser reload) read `accountId=ACC-2041` and `taskId=5f42a6b7-…` back from Ambiguous: same id, same fields, no duplicate created.
- **Decline** — Proposed a follow-up for `ACC-2058` (Solara Health), clicked-equivalent **Decline**, then confirmed Ambiguous still shows zero tasks for that account.
- **Intelligence round trip** — `copilotkit verify --expect-runtime intelligence --round-trip --agent default` passed: `/info` reports `mode: "intelligence"` and `runtimeEntitlements`, the agent answered a real request, and the resulting thread was persisted and scoped to the app's `identifyUser` (`GET /api/copilotkit/threads` showed it under `endUserId: "demo-account-manager"`).
- **OSS baseline (pre-Intelligence)** — Proved separately, before the conversion, with the same `verify --expect-runtime oss --round-trip` command: passed.

Not verified in this session: driving the browser UI end-to-end by hand (no browser automation was available here) — open `http://127.0.0.1:3100`, repeat the flow above by clicking through it, and confirm the same result and that `<CopilotThreadsDrawer />` lists the saved thread.

[CopilotKit docs](https://docs.copilotkit.ai/) · [Sponsor authentication and first calls](../../using-sponsor-tools.md) · [Demo prompts](../../dev-docs/demo-prompts.md)
