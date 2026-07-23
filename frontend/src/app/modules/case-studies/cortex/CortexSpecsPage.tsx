import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const accent = 'text-[#d43c24] dark:text-[#ff735b]';

const markdownComponents = {
  pre({ children }: any) {
    return <>{children}</>;
  },
  code({ className, children, ...props }: any) {
    const isBlock = /language-/.test(className || '') || String(children).includes('\n');
    if (isBlock) {
      return (
        <pre className="not-prose my-4 overflow-x-auto rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4 text-[12.5px] leading-relaxed font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[0.85em] font-mono" {...props}>
        {children}
      </code>
    );
  },
};

const SPEC = `## 01 / Purpose — Control effects beneath agent reasoning

Cortex is a kernel, not a smarter agent. Its responsibility begins when an actor proposes an operation that could produce an external effect or committed state change. The kernel evaluates whether that request carries explicit authority under current policy. An allowed request proceeds through \`tool_broker\`. A request without sufficient authority is denied. Both paths produce evidence of the decision.

> **Core rule.** Reasoning quality does not confer authority. Confidence, intent, conversational context, and access to a tool name are not substitutes for an explicit authorization decision.

## 02 / Invariants — Properties that must remain true

A Cortex implementation preserves these invariants regardless of the agent, model, tool, or application attached to it.

- **INV-01 Default deny.** A request is denied unless sufficient authority is established.
- **INV-02 Explicit scope.** Authority applies to declared operations and targets, not general intent.
- **INV-03 Brokered effects.** Authorized tool execution crosses the effect boundary through \`tool_broker\`.
- **INV-04 Sole writer.** \`tool_broker\` is the only component permitted to commit controlled state.
- **INV-05 Decision before effect.** Authorization completes before a requested write is committed.
- **INV-06 Receipt after decision.** Allowed, denied, and failed requests return evidence of their path.

## 03 / Execution flow — One controlled path from proposal to state

1. **Input.** The actor, intent, target, context, and presented authority enter the kernel together.
2. **Gate.** The kernel resolves an explicit allow or deny decision. Absence of proof resolves to deny.
3. **Dispatch.** The broker owns the controlled tool invocation and write path.
4. **Commit.** An allowed write is committed through the sole writer, or execution fails without an alternate path.
5. **Evidence.** The receipt connects request, decision, execution outcome, and resulting state reference.

\`\`\`
decision = authorize(request, authority, policy)
if decision != ALLOW:
    return receipt(request, decision, no_effect)
result = tool_broker.execute(request.operation)
return receipt(request, decision, result)
\`\`\`

## 04 / Request contract — Make the proposed effect concrete

The authorization boundary needs a structured description of what is being requested. A free-form model message is not itself an execution contract. The envelope carries the actor, intent, target, context, and presented authority.

## 05 / Authorization — Explicit, scoped, policy-checked

A declared grant must cover the request's operation and target scope. The policy gate evaluates current constraints at the boundary where the concrete effect is known — not earlier, when only intent is visible. Missing, unknown, invalid, or insufficient authority resolves to a refusal.

## 06 / Tool broker — The sole writer

Allowed tool execution is routed through \`tool_broker\` instead of direct agent access, and controlled writes are concentrated there so authorization cannot be bypassed by a parallel path.

## 07 / Receipts — Evidence for every outcome

A receipt binds, for a single request, the proposal that was made, the authorization decision and the policy it was evaluated under, the writer identity, and the observed outcome and resulting state reference. Because a receipt is produced for a denial as well as a success, the log distinguishes "refused" from "silently did nothing".

## 08 / Seven mechanisms — The complete control path

Request envelope · deny by default · explicit authority · policy gate · brokered tools · sole-writer commit · execution receipts. See the [decision-flow diagrams](/case-studies/cortex/flow).

## 09 / Field comparison — What Cortex is designed to control

Cortex complements reasoning systems and tool-integration layers, but it does not treat either one as an authorization kernel.

| Field | Smarter agent | Tool wrapper | Cortex kernel |
| --- | --- | --- | --- |
| Primary concern | Planning quality and task performance | Invocation and integration behavior | Which effects may become state changes |
| Authority | May remain implicit in tool access | May vary by wrapper or call site | Explicit, scoped, and policy-checked |

## 10 / Failure behavior — Every failure resolves to a refusal, with evidence

The kernel has no silent-failure path. Missing authority, an unsatisfied policy, or an execution fault all resolve the same way: no controlled state change, and a receipt that records what happened. \`tool_broker\` remains the sole writer; a denied or failed request produces evidence, not a partial or unattributed state change.

## 11 / Status — Where this specification stands

Cortex is presented here as a constrained-execution kernel and architecture case study. Deployment readiness, policy coverage, and operational guarantees remain properties of a specific implementation and environment. Related: the [case-study overview](/case-studies/cortex), the [decision-flow diagrams](/case-studies/cortex/flow), and research paper [db-r-2026-002](/research/papers/db-r-2026-002).`;

export function CortexSpecsPage() {
  useEffect(() => {
    document.title = 'Cortex | Technical specification';
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f6f1] dark:bg-[#181916] text-[#181914] dark:text-[#f3f0e7]">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-12 pb-24">
        <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link to="/case-studies/cortex" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Overview</Link>
          <span className={`font-semibold ${accent}`}>Specs</span>
          <Link to="/case-studies/cortex/flow" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Flow</Link>
        </nav>

        <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${accent}`}>CX-SPEC / constrained execution</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
          Cortex technical specification
        </h1>
        <p className="mt-4 max-w-prose text-neutral-600 dark:text-neutral-400">
          An execution-kernel contract for deny-by-default authorization, brokered effects, sole-writer state
          transitions, and verifiable receipts.
        </p>

        <div className="cortex-spec mt-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {SPEC}
          </ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
