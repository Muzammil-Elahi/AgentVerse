import { Agent, run } from "@openai/agents";
import { evaluateQuery } from "@/lib/safeguard";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: unknown };
    if (typeof body.query !== "string" || !body.query.trim() || body.query.length > 4_000)
      return Response.json({ error: "A valid query is required." }, { status: 400 });

    // This server-side check is the enforcement boundary. The browser cannot
    // make the generation route process a blocked, cached, or review query.
    const decision = evaluateQuery(body.query);
    if (decision.decision !== "allow")
      return Response.json(
        { error: `TrustLayer denied generation: ${decision.decision}.` },
        { status: 403 },
      );

    const agent = new Agent({
      name: "TrustLayer enterprise assistant",
      model: process.env.MODEL?.replace(/^openai[:/]/, "") || "gpt-4.1-mini",
      instructions:
        "Answer the approved workplace request helpfully and concisely. Do not reveal credentials, private employee information, or restricted company data. Never claim access to company systems you were not given.",
    });
    const result = await run(agent, body.query, { maxTurns: 4 });
    return Response.json({ answer: String(result.finalOutput ?? "No response was generated.") });
  } catch (error) {
    const message =
      error instanceof Error && /API.key|OPENAI_API_KEY|apiKey/i.test(error.message)
        ? "Generation is approved, but OPENAI_API_KEY is not configured."
        : "The approved model request could not be completed.";
    return Response.json({ error: message }, { status: 503 });
  }
}
