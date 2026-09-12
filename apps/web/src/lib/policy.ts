export const TRUSTLAYER_POLICY = {
  allowed: [
    "Approved company policies",
    "Product documentation",
    "Internal processes",
    "General writing assistance",
    "Summarization",
  ],
  review: [
    "Employee compensation",
    "Personal employee information",
    "Legal interpretation",
    "Customer financial information",
    "High-impact business decisions",
    "Confidential internal data",
  ],
  blocked: [
    "Passwords and API keys",
    "Authentication secrets and private credentials",
    "Security-control bypass",
    "Restricted personal data",
  ],
} as const;

type PolicyResult = {
  level: "allow" | "review" | "block";
  reason: string;
  category: string;
  riskSignals: string[];
  safeAlternative?: string;
};

export function evaluatePolicy(query: string): PolicyResult {
  const text = query.toLowerCase();
  const credential = /\b(api[\s-]?keys?|passwords?|private keys?|access tokens?|auth(?:entication)? secrets?|credentials?)\b/;
  const credentialDisclosure =
    /\b(show|tell|give|send|share|reveal|expose|print|list|find|retrieve|dump|what(?:'s| is| are))\b.{0,60}\b(api[\s-]?keys?|passwords?|private keys?|access tokens?|auth(?:entication)? secrets?|credentials?)\b/;
  const bypass = /\b(bypass|disable|evade|circumvent)\b.{0,35}\b(security|authentication|controls?|guardrails?)\b/;
  if ((credential.test(text) && credentialDisclosure.test(text)) || bypass.test(text)) {
    return {
      level: "block",
      reason: "Credential request detected; prohibited by organizational security policy.",
      category: "Security credentials",
      riskSignals: ["Credential request detected", "Restricted production information"],
    };
  }

  if (/\b(salar(?:y|ies)|compensation|payroll|wages?)\b/.test(text)) {
    return {
      level: "review",
      reason: "Individual compensation data requires an explicit human decision.",
      category: "Employee compensation",
      riskSignals: [
        "Employee compensation",
        "Potential PII",
        "Confidential employee information",
      ],
      safeAlternative: "Provide approved compensation bands without identifying individuals.",
    };
  }
  if (/\b(legal advice|interpret (?:this )?(?:law|contract)|customer financial|social security|medical record|layoff decision)\b/.test(text)) {
    return {
      level: "review",
      reason: "Sensitive or high-impact information requires human review.",
      category: "Sensitive enterprise information",
      riskSignals: ["Sensitive internal information", "High-impact request"],
      safeAlternative: "Provide a general, non-identifying summary of the applicable approved policy.",
    };
  }
  return {
    level: "allow",
    reason: /\b(write|draft|follow[- ]?up|rewrite)\b/.test(text)
      ? "Permitted general writing assistance."
      : "No restricted policy signals detected.",
    category: "Allowed workplace assistance",
    riskSignals: [],
  };
}
