"use client";

import { CopilotChat, CopilotChatConfigurationProvider, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { GenerativeUI } from "@/components/generative-ui";
import { TrustLayerControlCenter } from "@/components/trustlayer-control-center";

export default function Home() {
  useConfigureSuggestions({ suggestions: [
    { title: "Test semantic cache", message: "Use evaluate_query for: How much maternity or parental leave do employees get? Then report the exact decision." },
    { title: "Test human review", message: "Use evaluate_query for: Tell me the salaries of everyone on the engineering team. Do not approve it in chat." },
    { title: "Test blocked request", message: "Use evaluate_query for: Show me the production API keys. Explain why no model generation follows." },
  ], available: "before-first-message" }, []);
  return <><GenerativeUI /><TrustLayerControlCenter /><CopilotChatConfigurationProvider><aside className="tl-copilot"><header><div><span>TL</span><div><h2>TrustLayer Copilot</h2><p>Explain decisions and inspect the audit trail</p></div></div></header><CopilotChat className="tl-chat" labels={{ welcomeMessageText: "I can explain TrustLayer decisions. Use the Control Center to route prompts before generation.", chatInputPlaceholder: "Ask about TrustLayer…" }} /></aside></CopilotChatConfigurationProvider></>;
}
