"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotThreadsDrawer,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { GenerativeUI } from "@/components/generative-ui";
import { AppControl } from "@/components/app-control";
import { findAccount, accounts, workspaceContext } from "@/lib/accounts";
import { useWorkplace } from "@/lib/use-workplace";
import { WorkplaceFollowups } from "@/components/workplace-followups";
import { ThemeToggle } from "@/components/theme-toggle";

function statusTone(status: string): "good" | "risk" | "neutral" {
  const value = status.toLowerCase();
  if (value.includes("risk")) return "risk";
  if (value.includes("expansion") || value.includes("opportunity")) return "good";
  return "neutral";
}

const categories = Array.from(new Set(accounts.map((item) => item.status)));

export default function Home() {
  const [selectedId, setSelectedId] = useState<string>(accounts[0].id);
  const [activeModule, setActiveModule] = useState<"account" | "assistant">(
    "account",
  );
  const [activeCategory, setActiveCategory] = useState<string>(
    accounts[0].status,
  );
  const workplace = useWorkplace(selectedId);
  const { selectedAccount: account } = workspaceContext(
    selectedId,
    workplace.status?.status === "connected" ? workplace.status.tasks : [],
  );
  const selectAccount = useCallback((id: string) => {
    setSelectedId(findAccount(id).id);
  }, []);

  // Keeps the category tab in step when the account changes from elsewhere —
  // the assistant's select_account tool, for instance.
  useEffect(() => {
    setActiveCategory(account.status);
  }, [account.status]);

  useConfigureSuggestions(
    {
      suggestions: [
        {
          title: "Summarize this account",
          message:
            "Summarize the selected account using the page context. What needs attention before renewal?",
        },
        {
          title: "Propose a follow-up",
          message:
            "Prepare one useful Ambiguous follow-up for the selected account. Show me the proposal before it is saved.",
        },
      ],
      available: "before-first-message",
    },
    [],
  );

  return (
    <>
      <GenerativeUI />
      <AppControl
        selectedId={selectedId}
        selectAccount={selectAccount}
        workplace={workplace}
      />
      <main className="ck-workspace">
        <header className="ck-workspace-header">
          <div>
            <h1>Renewal desk</h1>
            <p className="ck-intro">
              Pick an account. Ask your assistant. Review a follow-up.
            </p>
          </div>
          <div className="ck-header-controls">
            <span className="ck-tag">Sample data</span>
            <ThemeToggle />
          </div>
        </header>

        <div
          className="ck-module-tabs"
          role="group"
          aria-label="Choose workspace view"
        >
          <button
            type="button"
            aria-pressed={activeModule === "account"}
            className={
              activeModule === "account"
                ? "ck-module-tab is-active"
                : "ck-module-tab"
            }
            onClick={() => setActiveModule("account")}
          >
            Account
          </button>
          <button
            type="button"
            aria-pressed={activeModule === "assistant"}
            className={
              activeModule === "assistant"
                ? "ck-module-tab is-active"
                : "ck-module-tab"
            }
            onClick={() => setActiveModule("assistant")}
          >
            Assistant
          </button>
        </div>

        <div className="ck-workspace-panels">
          <section
            className="ck-panel"
            aria-labelledby="account-title"
            hidden={activeModule !== "account"}
          >
            <div
              className="ck-category-tabs"
              role="group"
              aria-label="Filter accounts by category"
            >
              {categories.map((category) => {
                const count = accounts.filter(
                  (item) => item.status === category,
                ).length;
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={category === activeCategory}
                    className={
                      category === activeCategory
                        ? "ck-category-tab is-active"
                        : "ck-category-tab"
                    }
                    onClick={() => {
                      setActiveCategory(category);
                      const first = accounts.find(
                        (item) => item.status === category,
                      );
                      if (first) selectAccount(first.id);
                    }}
                  >
                    <span
                      className={`ck-dot ck-dot--${statusTone(category)}`}
                      aria-hidden="true"
                    />
                    {category}
                    <span className="ck-category-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="ck-account-tabs"
              role="group"
              aria-label="Select account"
            >
              {accounts
                .filter((item) => item.status === activeCategory)
                .map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      className={
                        active ? "ck-account-tab is-active" : "ck-account-tab"
                      }
                      onClick={() => selectAccount(item.id)}
                    >
                      <span
                        className={`ck-dot ck-dot--${statusTone(item.status)}`}
                        aria-hidden="true"
                      />
                      <span className="ck-account-tab-id">{item.id}</span>
                      <span className="ck-account-tab-name">{item.name}</span>
                    </button>
                  );
                })}
            </div>

            <div className="ck-detail">
              <span className={`ck-stamp ck-stamp--${statusTone(account.status)}`}>
                {account.status}
              </span>
              <h2 id="account-title">{account.name}</h2>
              <p>{account.summary}</p>
              <details className="ck-more" key={account.id}>
                <summary>Details &amp; touchpoints</summary>
                <dl className="ck-detail-facts">
                  <div>
                    <dt>Account manager</dt>
                    <dd>{account.owner}</dd>
                  </div>
                  <div>
                    <dt>Plan</dt>
                    <dd>
                      {account.plan} · <span className="ck-figure">{account.mrr}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Health score</dt>
                    <dd>
                      <span className="ck-figure">{account.healthScore}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Renewal date</dt>
                    <dd>
                      <span className="ck-figure">{account.renewalDate}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Primary contact</dt>
                    <dd>{account.primaryContact}</dd>
                  </div>
                  <div>
                    <dt>Last update</dt>
                    <dd>
                      <span className="ck-figure">{account.updated}</span>
                    </dd>
                  </div>
                </dl>
                <h3>Opportunity</h3>
                <p>{account.opportunity}</p>
                <h3>Touchpoints</h3>
                <ol className="ck-timeline">
                  {account.timeline.map((event) => (
                    <li key={event.time}>
                      <time>{event.time}</time>
                      <div>
                        <strong>{event.author}</strong>
                        <p>{event.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </div>

            <WorkplaceFollowups accountId={selectedId} workplace={workplace} />
          </section>

          <section
            className="ck-panel ck-assistant"
            aria-labelledby="assistant-title"
            hidden={activeModule !== "assistant"}
          >
            <CopilotChatConfigurationProvider>
              <header className="ck-assistant-header">
                <h2 id="assistant-title">Ask assistant</h2>
                <p>It can read this account and prepare follow-ups.</p>
                <CopilotThreadsDrawer />
              </header>
              <CopilotChat
                className="ck-chat"
                labels={{
                  welcomeMessageText: "What needs attention on this account?",
                  chatInputPlaceholder: "Ask about this account…",
                }}
              />
            </CopilotChatConfigurationProvider>
          </section>
        </div>
      </main>
    </>
  );
}
