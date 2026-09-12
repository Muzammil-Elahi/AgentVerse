import { evaluatePolicy } from "./policy";
import { findSemanticMatch } from "./semantic-cache";
import type { ApprovedAnswer, QueryDecision, SafeguardMetrics } from "./safeguard-types";

export function evaluateQuery(query: string, approvedAnswers?: ApprovedAnswer[]): QueryDecision {
  const normalized = query.trim();
  if (!normalized) throw new Error("Enter a query for TrustLayer to evaluate.");
  const base = { id: crypto.randomUUID(), query: normalized, createdAt: new Date().toISOString() };
  const match = findSemanticMatch(normalized, approvedAnswers);
  if (match) return {
    ...base, decision: "reuse", reason: "Approved knowledge found above the semantic reuse threshold.",
    matchedQuery: match.entry.canonicalQuestion, matchedAnswerId: match.entry.id,
    similarity: match.similarity, policyCategory: match.entry.category, riskSignals: [],
    llmCalled: false, answer: match.entry.answer,
  };
  const policy = evaluatePolicy(normalized);
  return {
    ...base, decision: policy.level, reason: policy.reason, policyCategory: policy.category,
    riskSignals: policy.riskSignals, safeAlternative: policy.safeAlternative,
    reviewOutcome: policy.level === "review" ? "pending" : undefined, llmCalled: false,
  };
}

export function calculateMetrics(decisions: QueryDecision[]): SafeguardMetrics {
  const cacheHits = decisions.filter((d) => d.decision === "reuse").length;
  const blockedRequests = decisions.filter((d) => d.decision === "block").length;
  const humanEscalations = decisions.filter((d) => d.decision === "review").length;
  const rejectedHumanReviews = decisions.filter((d) => d.reviewOutcome === "rejected").length;
  const generativeLlmCalls = decisions.filter((d) => d.llmCalled).length;
  const llmCallsAvoided = cacheHits + blockedRequests + rejectedHumanReviews;
  return { totalQueries: decisions.length, generativeLlmCalls, cacheHits, blockedRequests, humanEscalations, rejectedHumanReviews, llmCallsAvoided, avoidanceRate: decisions.length ? llmCallsAvoided / decisions.length : 0 };
}
