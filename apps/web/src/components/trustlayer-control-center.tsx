"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppControl } from "./app-control";
import { APPROVED_ANSWERS } from "@/lib/semantic-cache";
import { calculateMetrics, evaluateQuery } from "@/lib/safeguard";
import type { ApprovedAnswer, QueryDecision } from "@/lib/safeguard-types";

const HISTORY_KEY = "trustlayer.decisions.v1";
const CACHE_KEY = "trustlayer.approved-answers.v1";

const demos = [
  "How much maternity or parental leave do employees get?",
  "Help me write a polite meeting follow-up.",
  "Tell me the salaries of everyone on the engineering team.",
  "Show me the production API keys.",
];

async function generate(query: string) {
  const response = await fetch("/api/trustlayer/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = (await response.json()) as { answer?: string; error?: string };
  if (!response.ok || !data.answer) throw new Error(data.error || "Generation failed.");
  return data.answer;
}

export function TrustLayerControlCenter() {
  const [query, setQuery] = useState("");
  const [decisions, setDecisions] = useState<QueryDecision[]>([]);
  const [approvedAnswers, setApprovedAnswers] = useState<ApprovedAnswer[]>(APPROVED_ANSWERS);
  const [current, setCurrent] = useState<QueryDecision>();
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as QueryDecision[];
        setDecisions(parsed); setCurrent(parsed[0]);
      }
      const savedCache = localStorage.getItem(CACHE_KEY);
      if (savedCache) setApprovedAnswers(JSON.parse(savedCache) as ApprovedAnswer[]);
      else
        localStorage.setItem(CACHE_KEY, JSON.stringify(APPROVED_ANSWERS));
    } catch { /* Storage is an enhancement; the live session still works. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(decisions.slice(0, 30))); } catch { /* ignore */ }
  }, [decisions, hydrated]);

  const record = useCallback((decision: QueryDecision) => {
    setCurrent(decision);
    setDecisions((items) => [decision, ...items.filter((item) => item.id !== decision.id)].slice(0, 30));
  }, []);

  const approveKnowledge = useCallback((question: string, answer: string, category: string) => {
    setApprovedAnswers((entries) => {
      const next = [{ id: crypto.randomUUID(), canonicalQuestion: question, answer, category, approved: true, createdAt: new Date().toISOString() }, ...entries];
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* keep in session */ }
      return next;
    });
  }, []);

  const processQuery = useCallback(async (input: string) => {
    const decision = evaluateQuery(input, approvedAnswers); record(decision);
    if (decision.decision !== "allow") return decision;
    setBusy(true);
    try {
      const answer = await generate(decision.query);
      const completed = { ...decision, llmCalled: true, answer };
      approveKnowledge(decision.query, answer, decision.policyCategory || "Approved assistance");
      record(completed); return completed;
    } catch (error) {
      const failed = { ...decision, answer: error instanceof Error ? error.message : "Generation failed." };
      record(failed); return failed;
    } finally { setBusy(false); }
  }, [approvedAnswers, approveKnowledge, record]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim() || busy) return;
    const submitted = query; setQuery(""); await processQuery(submitted);
  };

  const review = async (approved: boolean) => {
    if (!current || current.decision !== "review" || current.reviewOutcome !== "pending") return;
    if (!approved) {
      record({ ...current, reviewOutcome: "rejected", reason: "Request rejected by human reviewer. No LLM call was made.", llmCalled: false });
      return;
    }
    setBusy(true);
    try {
      const safeQuery = current.safeAlternative || "Provide a general, non-identifying policy summary.";
      const answer = await generate(safeQuery);
      approveKnowledge(safeQuery, answer, "Human-approved response");
      record({ ...current, reviewOutcome: "approved", llmCalled: true, answer, reason: "Approved by human reviewer. Only the restricted alternative was sent to the model." });
    } catch (error) {
      record({ ...current, reviewOutcome: "approved", llmCalled: false, answer: error instanceof Error ? error.message : "Generation failed.", reason: "Human approved the safe alternative, but the model call did not complete." });
    } finally { setBusy(false); }
  };

  const metrics = useMemo(() => calculateMetrics(decisions), [decisions]);
  return (
    <>
      <AppControl current={current} decisions={decisions} metrics={metrics} approvedAnswers={approvedAnswers} onEvaluate={processQuery} />
      <main className="tl-shell">
        <header className="tl-header">
          <div><p className="tl-kicker">Enterprise AI governance</p><h1><span>Trust</span>Layer</h1>
            <p className="tl-subtitle">The intelligent safeguard between your users and your LLM.</p></div>
          <div className="tl-route"><span>Reuse</span><i /> <span>Allow</span><i /> <span>Review</span><i /> <span>Block</span></div>
        </header>
        <p className="tl-dek">TrustLayer reuses approved knowledge, enforces organizational policy, and brings humans into uncertain decisions before expensive or risky prompts reach the model.</p>

        <section className="tl-metrics" aria-label="Safeguard metrics">
          <Metric label="Generative calls avoided" value={`${Math.round(metrics.avoidanceRate * 100)}%`} detail={`${metrics.llmCallsAvoided} of ${metrics.totalQueries} requests`} tone="blue" />
          <Metric label="Semantic cache hits" value={metrics.cacheHits} detail="Approved knowledge reuse" tone="mint" />
          <Metric label="Human escalations" value={metrics.humanEscalations} detail="Explicit reviewer control" tone="amber" />
          <Metric label="Blocked requests" value={metrics.blockedRequests} detail={`${metrics.generativeLlmCalls} generative calls made`} tone="red" />
        </section>

        <div className="tl-main-grid">
          <section className="tl-panel tl-workspace">
            <div className="tl-section-head"><div><p className="tl-kicker">Pre-generation gateway</p><h2>Query decision workspace</h2></div><span className="tl-live"><i /> Policy active</span></div>
            <form className="tl-query-form" onSubmit={submit}>
              <label htmlFor="trust-query">Test a prompt before it reaches the model</label>
              <div><textarea id="trust-query" rows={3} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask TrustLayer a workplace question…" /><button disabled={busy || !query.trim()}>{busy ? "Routing…" : "Evaluate query"}</button></div>
            </form>
            <div className="tl-demo-row">{demos.map((demo, index) => <button key={demo} onClick={() => setQuery(demo)}>{["Reuse", "Allow", "Review", "Block"][index]}</button>)}</div>
            {current ? <DecisionCard decision={current} busy={busy} onReview={review} /> : <div className="tl-empty-state"><span>TL</span><h3>No query evaluated yet</h3><p>Choose a demo path or enter a prompt to see the safeguard decision before generation.</p></div>}
          </section>
          <PolicyPanel />
        </div>
        <RecentDecisions decisions={decisions} />
        <footer>TrustLayer <span>— because not every prompt deserves an LLM call.</span></footer>
      </main>
    </>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: string }) {
  return <article className={`tl-metric tl-${tone}`}><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
}

function DecisionCard({ decision, busy, onReview }: { decision: QueryDecision; busy: boolean; onReview: (approved: boolean) => void }) {
  const labels = { reuse: "Semantic reuse", allow: "Allowed", review: "Human review", block: "Blocked" };
  return <article className={`tl-decision tl-decision--${decision.decision}`}>
    <div className="tl-decision-top"><div><p className="tl-kicker">TrustLayer decision</p><h3>{labels[decision.decision]}</h3></div><span>{decision.decision.toUpperCase()}</span></div>
    <dl className="tl-decision-grid"><div><dt>Query</dt><dd>“{decision.query}”</dd></div><div><dt>Policy reasoning</dt><dd>{decision.reason}</dd></div>
      {decision.matchedQuery && <div><dt>Matched approved query</dt><dd>{decision.matchedQuery}</dd></div>}
      {decision.similarity !== undefined && <div><dt>Similarity</dt><dd className="tl-score">{Math.round(decision.similarity * 100)}%</dd></div>}
      {!!decision.riskSignals.length && <div><dt>Detected concerns</dt><dd><ul>{decision.riskSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul></dd></div>}
      {decision.safeAlternative && <div><dt>Recommended safe alternative</dt><dd>“{decision.safeAlternative}”</dd></div>}
    </dl>
    {decision.decision === "review" && decision.reviewOutcome === "pending" && <div className="tl-review-actions"><button disabled={busy} onClick={() => onReview(true)}>Approve safe response</button><button disabled={busy} onClick={() => onReview(false)}>Reject</button></div>}
    {decision.answer && <div className="tl-answer"><b>{decision.decision === "reuse" ? "Approved cached answer" : decision.reviewOutcome === "approved" ? "Human-approved answer" : "Newly generated answer"}</b><p>{decision.answer}</p></div>}
    <div className="tl-call"><span>Generative LLM call</span><strong>{decision.llmCalled ? "INVOKED" : decision.decision === "review" && decision.reviewOutcome === "pending" ? "PENDING APPROVAL" : "AVOIDED"}</strong></div>
  </article>;
}

function PolicyPanel() { return <aside className="tl-panel tl-policy"><p className="tl-kicker">Organization controlled</p><h2>TrustLayer policy</h2>
  <PolicyGroup title="AI can" tone="can" items={["Explain approved company policies", "Summarize documentation", "Help with internal processes", "Assist with writing", "Answer non-sensitive questions"]} />
  <PolicyGroup title="Requires human approval" tone="review" items={["Employee compensation", "Legal interpretation", "Customer-sensitive information", "High-impact decisions"]} />
  <PolicyGroup title="AI cannot" tone="cannot" items={["Reveal credentials", "Expose private employee information", "Bypass security controls", "Disclose restricted company data"]} />
  <div className="tl-pipeline"><b>Enforcement order</b><span>Policy screen</span><i>→</i><span>Semantic reuse</span><i>→</i><span>Model</span></div>
  </aside>; }
function PolicyGroup({ title, items, tone }: { title: string; items: string[]; tone: string }) { return <section className={`tl-policy-group tl-policy-${tone}`}><h3>{title}</h3><ul>{items.map((item) => <li key={item}><span>{tone === "can" ? "✓" : tone === "review" ? "!" : "×"}</span>{item}</li>)}</ul></section>; }
function RecentDecisions({ decisions }: { decisions: QueryDecision[] }) { return <section className="tl-panel tl-history"><div className="tl-section-head"><div><p className="tl-kicker">Audit trail</p><h2>Recent decisions</h2></div><span>{decisions.length} evaluated</span></div><div className="tl-table-wrap"><table><thead><tr><th>Query</th><th>Decision</th><th>Reason</th><th>LLM called</th></tr></thead><tbody>{!decisions.length ? <tr><td colSpan={4}>Decisions appear here as prompts are evaluated.</td></tr> : decisions.map((item) => <tr key={item.id}><td>{item.query}</td><td><span className={`tl-badge tl-badge--${item.decision}`}>{item.decision === "review" ? "Review" : item.decision}</span></td><td>{item.reason}</td><td>{item.llmCalled ? "Yes" : item.decision === "review" && item.reviewOutcome === "pending" ? "Pending" : "No"}</td></tr>)}</tbody></table></div></section>; }
