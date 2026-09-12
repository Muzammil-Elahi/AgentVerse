"use client";

import { useComponent } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { DecisionSummaryCard } from "./streamed-cards";

export function GenerativeUI() {
  useComponent({
    name: "trustlayer_decision_card",
    description: "Render a concise explanation of a TrustLayer decision already present in page context. Never use this to invent or change a decision.",
    parameters: z.object({
      decision: z.enum(["reuse", "allow", "review", "block"]),
      query: z.string(), reason: z.string(),
      llmStatus: z.enum(["avoided", "invoked", "pending"]),
      matchedQuery: z.string().optional(), similarity: z.number().optional(),
    }),
    render: DecisionSummaryCard,
  });
  return null;
}
