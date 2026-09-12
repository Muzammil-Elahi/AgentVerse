export type SafeguardDecision = "reuse" | "allow" | "review" | "block";

export interface ApprovedAnswer {
  id: string;
  canonicalQuestion: string;
  aliases?: string[];
  answer: string;
  category: string;
  approved: boolean;
  embedding?: number[];
  createdAt: string;
}

export type ReviewOutcome = "pending" | "approved" | "rejected";

export interface QueryDecision {
  id: string;
  query: string;
  decision: SafeguardDecision;
  reason: string;
  matchedQuery?: string;
  matchedAnswerId?: string;
  similarity?: number;
  policyCategory?: string;
  riskSignals: string[];
  llmCalled: boolean;
  answer?: string;
  safeAlternative?: string;
  reviewOutcome?: ReviewOutcome;
  createdAt: string;
}

export interface SafeguardMetrics {
  totalQueries: number;
  generativeLlmCalls: number;
  cacheHits: number;
  blockedRequests: number;
  humanEscalations: number;
  rejectedHumanReviews: number;
  llmCallsAvoided: number;
  avoidanceRate: number;
}
