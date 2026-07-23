import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const MECHANISMS = [
  ['01', 'Request envelope', 'Structures the actor, intent, target, context, and presented authority before execution.'],
  ['02', 'Deny by default', 'Resolves missing, unknown, invalid, or insufficient authority to a refusal.'],
  ['03', 'Explicit authority', 'Requires a declared grant whose operation and target scope cover the request.'],
  ['04', 'Policy gate', 'Evaluates current constraints at the boundary where the concrete effect is known.'],
  ['05', 'Brokered tools', 'Routes allowed tool execution through tool_broker instead of direct agent access.'],
  ['06', 'Sole-writer commit', 'Concentrates controlled writes in the broker so authorization cannot be bypassed by a parallel path.'],
  ['07', 'Execution receipts', 'Return evidence connecting the proposal, authorization decision, broker outcome, and resulting state.'],
] as const;

const COMPARISON: Array<[string, string, string, string]> = [
  ['Primary concern', 'Planning quality and task performance', 'Invocation and integration behavior', 'Which effects may become state changes'],
  ['Authority', 'May remain implicit in tool access', 'May vary by wrapper or call site', 'Explicit, scoped, and policy-checked'],
  ['Failure posture', 'Retries or reasons around the error', 'Depends on the wrapper', 'tool_broker remains the sole writer'],
];

const PAPERS: Array<[string, string]> = [
  ['db-r-2026-002', 'Deny-by-default authorization for tool-using agents'],
  ['db-r-2026-003', 'Mechanically constraining an LLM orchestrator'],
  ['db-r-2026-004', 'Black-box and grey-box validation of agent work'],
  ['db-r-2026-001', 'Composition status and evidence boundaries'],
];

const accent = 'text-[#d43c24] dark:text-[#ff735b]';

export function CortexOverviewPage() {
  useEffect(() => {
    document.title = 'Cortex | A kernel for constrained execution';
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f6f1] dark:bg-[#181916] text-[#181914] dark:text-[#f3f0e7]">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 pt-12 pb-24">
        <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className={`font-semibold ${accent}`}>Overview</span>
          <Link to="/case-studies/cortex/specs" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Specs</Link>
          <Link to="/case-studies/cortex/flow" className="text-neutral-500 hover:text-[#d43c24] dark:hover:text-[#ff735b]">Flow</Link>
        </nav>

        {/* Hero */}
        <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${accent}`}>
          Cortex case study / constrained execution
        </p>
        <h1 className="mt-4 font-serif text-4xl sm:text-6xl font-semibold leading-[1.02] tracking-tight">
          A kernel,{' '}
          <span className={`italic ${accent}`}>not a smarter agent.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Cortex sits beneath agent reasoning. It authorizes every effect, denies what is not explicitly
          allowed, routes tools through a sole writer, and produces a receipt for the resulting state change.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/case-studies/cortex/specs"
            className="inline-flex items-center gap-2 rounded-sm bg-[#181914] dark:bg-[#f3f0e7] px-4 py-2.5 text-sm font-bold text-[#f7f6f1] dark:text-[#181914]"
          >
            Read technical specs <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <a
            href="#mechanisms"
            className="inline-flex items-center rounded-sm border border-[#181914] dark:border-[#f3f0e7] px-4 py-2.5 text-sm font-bold"
          >
            Seven mechanisms
          </a>
        </div>

        {/* Authorization record card */}
        <div className="mt-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#23241f] p-5 font-mono text-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3 text-neutral-500">
            <span className="uppercase tracking-wide">Authorization record</span>
            <span>04 / 17</span>
          </div>
          <dl className="mt-3 space-y-2">
            {[
              ['Intent', 'write.customer_note'],
              ['Principal', 'agent:caseworker'],
              ['Authority', 'scope mismatch'],
              ['Writer', 'tool_broker'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 uppercase text-xs tracking-wide">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-3">
            <span className="rounded-sm bg-[#f4ded8] dark:bg-[#452c26] px-2 py-0.5 text-xs font-bold text-[#d43c24] dark:text-[#ff735b]">
              Denied
            </span>
            <span className="text-neutral-400 text-xs">rcpt_7f21…9a</span>
          </div>
        </div>

        {/* Proposition */}
        <section className="mt-16 border-t border-neutral-300 dark:border-neutral-700 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">The proposition</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Intelligence proposes. The boundary decides.</h2>
          <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
            Reasoning quality does not confer authority. Confidence, intent, conversational context, and
            access to a tool name are not substitutes for an explicit authorization decision. Cortex owns
            authorization at the effect boundary, the brokered write path, and the receipt that binds a
            request to its observed outcome.
          </p>
        </section>

        {/* Seven mechanisms */}
        <section id="mechanisms" className="mt-16 scroll-mt-24 border-t border-neutral-300 dark:border-neutral-700 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">The architecture</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Seven mechanisms make the boundary real.</h2>
          <ol className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-300 dark:border-neutral-700">
            {MECHANISMS.map(([n, title, body]) => (
              <li key={n} className="grid grid-cols-[2.5rem_1fr] gap-4 py-4">
                <span className={`font-mono text-xs ${accent}`}>{n}</span>
                <div>
                  <b className="text-[15px]">{title}</b>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Field comparison */}
        <section className="mt-16 border-t border-neutral-300 dark:border-neutral-700 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">Field comparison</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Capability without a blank cheque.</h2>
          <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-300 dark:border-neutral-700">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Field</th>
                  <th className="px-4 py-3">Smarter agent</th>
                  <th className="px-4 py-3">Tool wrapper</th>
                  <th className="px-4 py-3 text-[#126449] dark:text-[#70d3ad]">Cortex kernel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {COMPARISON.map(([field, a, b, c]) => (
                  <tr key={field} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 whitespace-nowrap">{field}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{a}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{b}</td>
                    <td className="px-4 py-3">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Status */}
        <section className="mt-16 border-t border-neutral-300 dark:border-neutral-700 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">Status</p>
          <p className="mt-3 font-serif text-2xl">
            Cortex is presented here as a constrained-execution kernel and architecture case study.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            The status describes the system boundary documented in this case study. Deployment readiness,
            policy coverage, and operational guarantees remain properties of a specific implementation and
            environment.
          </p>
        </section>

        {/* Research */}
        <section className="mt-16 border-t border-neutral-300 dark:border-neutral-700 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">Research</p>
          <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
            The mechanisms described here are documented in Design Bakery research notes — arXiv-style, and
            marked pending until owner-approved.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {PAPERS.map(([id, title]) => (
              <li key={id}>
                <Link to={`/research/papers/${id}`} className={`${accent} underline underline-offset-2`}>
                  {id} — {title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/research" className={`${accent} underline underline-offset-2`}>
                All Design Bakery research →
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
