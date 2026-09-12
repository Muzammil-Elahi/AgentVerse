import type { ApprovedAnswer } from "./safeguard-types";

export const SEMANTIC_CACHE_THRESHOLD = 0.86;

export const APPROVED_ANSWERS: ApprovedAnswer[] = [
  {
    id: "parental-leave",
    canonicalQuestion: "What is our parental leave policy?",
    aliases: ["How much parental leave do employees get?", "What parental leave benefits are available?", "How long is maternity or parental leave?", "How much maternity or parental leave do employees get?"],
    answer: "Eligible employees can access the company's parental leave program. Refer to the HR policy portal for eligibility, duration, and jurisdiction-specific requirements.",
    category: "HR policy", approved: true, createdAt: "2026-09-12T09:00:00.000Z",
  },
  {
    id: "vacation", canonicalQuestion: "How many vacation days do employees receive?",
    aliases: ["What is the vacation policy?", "How much PTO do I get?"],
    answer: "Vacation allowances vary by location and tenure. The HR policy portal shows your current annual allowance and local carry-over rules.",
    category: "HR policy", approved: true, createdAt: "2026-09-12T09:01:00.000Z",
  },
  {
    id: "remote-work", canonicalQuestion: "What is the remote work policy?",
    aliases: ["Can employees work from home?", "How many days can I work remotely?"],
    answer: "Eligible teams may use the hybrid-work program subject to role, location, and manager guidance. Check the Workplace policy page for the approved schedule.",
    category: "Workplace policy", approved: true, createdAt: "2026-09-12T09:02:00.000Z",
  },
  {
    id: "password-reset", canonicalQuestion: "How do I reset my corporate password?",
    answer: "Use the company identity portal's password-reset flow. If you cannot verify your account, contact the IT service desk; never share your password.",
    category: "IT support", approved: true, createdAt: "2026-09-12T09:03:00.000Z",
  },
  {
    id: "expenses", canonicalQuestion: "How do I submit an expense report?",
    answer: "Open the expense portal, attach itemized receipts, select the appropriate cost center, and submit the report for manager approval.",
    category: "Finance operations", approved: true, createdAt: "2026-09-12T09:04:00.000Z",
  },
];

const stopWords = new Set(["a", "an", "the", "is", "are", "do", "does", "i", "me", "my", "our", "of", "to", "for", "or", "can", "much", "many"]);
function tokens(value: string) {
  return new Set(value.toLowerCase().replace(/maternity/g, "parental").replace(/pto/g, "vacation").match(/[a-z0-9]+/g)?.filter((word) => !stopWords.has(word)) ?? []);
}
export function similarity(left: string, right: string) {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.min(a.size, b.size);
}

export function findSemanticMatch(query: string, entries: ApprovedAnswer[] = APPROVED_ANSWERS) {
  let best: { entry: ApprovedAnswer; similarity: number } | undefined;
  for (const entry of entries.filter((item) => item.approved)) {
    for (const candidate of [entry.canonicalQuestion, ...(entry.aliases ?? [])]) {
      const score = similarity(query, candidate);
      if (!best || score > best.similarity) best = { entry, similarity: score };
    }
  }
  return best && best.similarity >= SEMANTIC_CACHE_THRESHOLD ? best : undefined;
}
