import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MermaidDiagram } from '@/modules/blog/render/MermaidDiagram';

const DECISION_PATH = `flowchart TD
  A["Actor proposes an operation"] --> B{"Explicit authority sufficient?"}
  B -- "no" --> D["Deny by default"]
  B -- "yes" --> P{"Policy gate: constraints satisfied?"}
  P -- "no" --> D
  P -- "yes" --> BR["Brokered execution (tool_broker)"]
  BR --> W["Sole-writer commit"]
  W --> R["Execution receipt"]
  D --> R2["Refusal receipt"]
  R --> AUD[["Audit trail"]]
  R2 --> AUD`;

const SEVEN_MECHANISMS = `flowchart TD
  M1["1 · Request envelope"] --> M2["2 · Deny by default"]
  M2 --> M3["3 · Explicit authority"]
  M3 --> M4["4 · Policy gate"]
  M4 --> M5["5 · Brokered tools"]
  M5 --> M6["6 · Sole-writer commit"]
  M6 --> M7["7 · Execution receipts"]`;

const LEGEND = [
  {
    title: 'Explicit authority',
    body: 'A declared grant whose operation and target scope cover the request. Missing, unknown, invalid, or insufficient authority resolves to a refusal.',
  },
  {
    title: 'Policy gate',
    body: 'Current constraints are evaluated at the boundary where the concrete effect is known — not earlier, when only intent is visible.',
  },
  {
    title: 'Sole-writer commit',
    body: 'Controlled writes are concentrated in tool_broker, so authorization cannot be bypassed by a parallel path.',
  },
  {
    title: 'Receipts',
    body: 'Evidence connecting the proposal, the authorization decision, the broker outcome, and the resulting state — for both approvals and refusals.',
  },
];

export function CortexFlowchartPage() {
  useEffect(() => {
    document.title = 'Cortex | How the kernel decides';
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f6f1] dark:bg-[#181916] text-[#181914] dark:text-[#f3f0e7]">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-12 pb-24">
        <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link to="/case-studies/cortex" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Overview</Link>
          <Link to="/case-studies/cortex/specs" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Specs</Link>
          <span className="font-semibold text-[#d43c24] dark:text-[#ff735b]">Flow</span>
          <Link to="/case-studies/cortex/evidence" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Evidence</Link>
        </nav>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#d43c24] dark:text-[#ff735b]">
          CX-FLOW / execution control
        </p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
          How the Cortex kernel decides.
        </h1>
        <p className="mt-4 max-w-prose text-neutral-600 dark:text-neutral-400">
          Every proposed operation follows one path: a request carrying declared authority, a
          deny-by-default check, a policy gate evaluated where the concrete effect is known, brokered
          execution through a sole writer, and a receipt that binds what was asked, what was decided, and
          what changed. The diagrams below read top to bottom.
        </p>

        <section className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">01 / Decision path</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">Request to receipt.</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            An actor never writes state directly. It proposes an operation; the kernel decides whether that
            proposal is permitted to become an effect. Denials and approvals both leave evidence.
          </p>
          <div className="mt-4">
            <MermaidDiagram chart={DECISION_PATH} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {LEGEND.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#23241f] p-4"
              >
                <h3 className="text-sm font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">02 / Seven mechanisms</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">The complete control path.</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            The decision above is enforced by seven mechanisms in sequence. Each one narrows what a proposal
            can become before it is allowed to touch state. Full definitions live in the{' '}
            <Link to="/case-studies/cortex/specs" className="text-[#d43c24] dark:text-[#ff735b] underline underline-offset-2">
              technical specification
            </Link>
            .
          </p>
          <div className="mt-4">
            <MermaidDiagram chart={SEVEN_MECHANISMS} />
          </div>
        </section>

        <section className="mt-14">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">03 / Related research</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">Where these decisions come from.</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/research/papers/db-r-2026-002" className="text-[#d43c24] dark:text-[#ff735b] underline underline-offset-2">
                db-r-2026-002 — Deny-by-default authorization for tool-using agents
              </Link>
            </li>
            <li>
              <Link to="/research/papers/db-r-2026-001" className="text-[#d43c24] dark:text-[#ff735b] underline underline-offset-2">
                db-r-2026-001 — Composition status and evidence boundaries
              </Link>
            </li>
            <li>
              <Link to="/research" className="text-[#d43c24] dark:text-[#ff735b] underline underline-offset-2">
                All Design Bakery research →
              </Link>
            </li>
          </ul>
          <p className="mt-6 border-l-2 border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800/50 p-3 text-[13px] text-neutral-600 dark:text-neutral-400">
            This page is a visual explainer of the kernel's control flow. It makes no benchmark or
            production-readiness claim; status language tracks the owner-approved research entries only.
          </p>
        </section>
      </div>
    </main>
  );
}
