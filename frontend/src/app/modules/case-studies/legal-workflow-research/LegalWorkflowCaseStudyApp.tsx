import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogData } from '@/modules/blog/data/blogData';
import { CaseStudySiteNav } from './CaseStudySiteNav';
import {
  AGENT_PIPELINE_STEPS,
  ARCHITECTURE_LAYERS,
  AUTHORITY_RANKS,
  BLOGS_INDEX_PATH,
  CASE_OS_PRESENTATION_DEMO_PATH,
  LEGAL_WORKFLOW_GITHUB,
  LEGAL_WORKFLOW_INTERACTIVE_DEMO_PATH,
  LEGAL_WORKFLOW_TECHNICAL_DEMO_URL,
  RESEARCH_REPOS,
  SOURCES_FOOTER,
  STUDY_BLOG_TRAIL,
} from './legalWorkflowCaseStudyData';
import { StaticDemoLink } from './StaticDemoLink';
import { resolveStudyBlogHref } from './resolveStudyBlogHref';
import './legal-workflow-case-study.css';

function PipelineSteps({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <div className="lwr-pipeline">
      {steps.map((step, index) => (
        <div key={step.title} className="lwr-step">
          <div className="lwr-num">{String(index + 1).padStart(2, '0')}</div>
          <div className="lwr-step-body">
            <strong>{step.title}</strong>
            <span>{step.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const ARBITRATION_TABS = [
  {
    id: 'round1',
    label: 'Round 1',
    title: 'Independent extraction',
    body: 'Model A and Model B extract fields independently. The system compares field by field, not document by document.',
  },
  {
    id: 'round2',
    label: 'Round 2',
    title: 'Reasoning exchange',
    body: 'Only disputed fields enter arbitration. Each model re-examines the source with the other model’s reasoning.',
  },
  {
    id: 'round3',
    label: 'Round 3',
    title: 'Convergence check',
    body: 'Converged fields route forward if risk allows. Partial convergence is flagged. Entrenched disagreement goes to human review.',
  },
] as const;

export function LegalWorkflowCaseStudyApp() {
  const { blogs } = useBlogData();
  const [arbitrationTab, setArbitrationTab] = useState<(typeof ARBITRATION_TABS)[number]['id']>(
    'round1',
  );

  const studyBlogLinks = useMemo(
    () =>
      STUDY_BLOG_TRAIL.map((entry) => ({
        ...entry,
        href: resolveStudyBlogHref(entry, blogs),
      })),
    [blogs],
  );

  const confidenceBlogHref =
    studyBlogLinks.find((entry) => entry.title.includes('Extraction Is Easy'))?.href ??
    '/endtoend-engineer/blogs/23';

  const activeArbitration = ARBITRATION_TABS.find((tab) => tab.id === arbitrationTab)!;

  return (
    <div className="lwr-case-study min-h-screen">
      <CaseStudySiteNav />

      <header id="top" className="lwr-hero lwr-wrap">
        <div className="lwr-hero-grid">
          <div>
            <div className="lwr-eyebrow">Case Study · Legal Workflow Research</div>
            <h1 className="lwr-h1">Legal Workflow Research</h1>
            <p className="lwr-lede">
              Building safer AI systems for litigation operations through document intelligence,
              confidence routing, human review, procedural memory, and agent-safe architecture.
            </p>
            <div className="lwr-badge-row">
              {[
                'Legal AI',
                'Document Intelligence',
                'Workflow Systems',
                'RAG',
                'Human Review',
                'AI Evals',
                'Agent Architecture',
              ].map((badge) => (
                <span key={badge} className="lwr-badge">
                  {badge}
                </span>
              ))}
            </div>
            <div className="lwr-btn-row">
              <button
                type="button"
                className="lwr-btn lwr-btn-primary"
                onClick={() =>
                  document
                    .getElementById('interactive-demo')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                View Demo
              </button>
            </div>
            <p className="lwr-lede" style={{ marginTop: 24, fontSize: 18 }}>
              This research explores how legal AI systems can move beyond extracting information
              and start safely routing workflow decisions: when to act, when to block, when to ask
              for review, and how to learn from prior procedural ambiguity.
            </p>
          </div>
          <div className="lwr-hero-card">
            <div className="lwr-kicker">Core thesis</div>
            <p className="lwr-quote">
              A legal AI system can extract the right-looking field, retrieve a real rule, and
              still produce the wrong workflow action.
            </p>
            <div className="lwr-signal">
              <div className="lwr-signal-box">
                <h4>Extraction</h4>
                <pre className="lwr-code">{`{
  "deadline": "2026-07-30",
  "confidence": 0.91
}`}</pre>
              </div>
              <div className="lwr-arrow">→</div>
              <div className="lwr-signal-box">
                <h4>Workflow Gate</h4>
                <pre className="lwr-code">{`{
  "routing": "blocked_task",
  "reason": "trigger event unknown"
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="interactive-demo" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Interactive Demo</div>
            <h2>Case OS Interactive Demo</h2>
            <p className="lwr-lede">
              Explore the recruiter-facing product story and workflow demo for a litigation Case OS.
              The presentation explains the problem, the planned solution, the AI workflow engineering
              layer, and how the system connects documents, rules, drafts, emails, calendar work, and
              human review. The workflow demo shows a synthetic Bill of Particulars task moving from
              pending to complete through source-aware AI assistance.
            </p>
            <div className="lwr-grid lwr-grid-2 lwr-demo-cards">
              <div className="lwr-card lwr-demo-card">
                <h3>Product Presentation</h3>
                <p>
                  See the full Case OS story, problem, solution, productivity value, and engineering
                  layer.
                </p>
                <StaticDemoLink className="lwr-btn lwr-btn-primary" href={CASE_OS_PRESENTATION_DEMO_PATH}>
                  View Presentation
                </StaticDemoLink>
              </div>
              <div className="lwr-card lwr-demo-card">
                <h3>Workflow Demo</h3>
                <p>
                  Try a synthetic BOP and OPA email workflow from pending task to completed filing.
                </p>
                <StaticDemoLink
                  className="lwr-btn lwr-btn-primary"
                  href={LEGAL_WORKFLOW_INTERACTIVE_DEMO_PATH}
                >
                  Try Workflow Demo
                </StaticDemoLink>
              </div>
            </div>
            <div className="lwr-btn-row lwr-demo-secondary">
              <a
                className="lwr-btn"
                href={LEGAL_WORKFLOW_TECHNICAL_DEMO_URL}
                target="_blank"
                rel="noreferrer"
              >
                Go to Technical Demo
              </a>
              <a
                className="lwr-btn"
                href={LEGAL_WORKFLOW_GITHUB}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub
              </a>
            </div>
          </div>
        </section>

        <section id="overview" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Overview</div>
            <h2>From extraction to workflow judgment</h2>
            <div className="lwr-big-card">
              <p className="lwr-lede">
                This research explores how legal AI systems can move beyond extracting information
                and start safely routing workflow decisions: when to act, when to block, when to
                ask for review, and how to learn from prior procedural ambiguity.
              </p>
              <p className="lwr-lede" style={{ marginTop: 16, fontSize: 17 }}>
                This research is informed by anonymized litigation-operations observations,
                workflow notes, and synthetic public-facing examples.
              </p>
            </div>
            <div className="lwr-grid lwr-grid-3" style={{ marginTop: 18 }}>
              <div className="lwr-card">
                <h3>Extraction Accuracy</h3>
                <p>Did the model find the right-looking value?</p>
              </div>
              <div className="lwr-card">
                <h3>≠</h3>
                <p>Correct text does not automatically mean safe workflow action.</p>
              </div>
              <div className="lwr-card">
                <h3>Workflow Confidence</h3>
                <p>Is the system allowed to use this field to change the workflow?</p>
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Problem</div>
            <h2>The failure pattern</h2>
            <p className="lwr-lede">
              Most legal AI demos stop at: Document → OCR → structured JSON → confidence score.
              That works for demos. It breaks when extracted fields affect litigation operations.
            </p>
            <div className="lwr-grid lwr-grid-4" style={{ marginTop: 18 }}>
              <div className="lwr-card">
                <h3>Court date</h3>
                <p>Calendar event or dependency planning.</p>
              </div>
              <div className="lwr-card">
                <h3>Judge name</h3>
                <p>Case summary or part-rule lookup.</p>
              </div>
              <div className="lwr-card">
                <h3>Filing deadline</h3>
                <p>Reminder or litigation risk workflow.</p>
              </div>
              <div className="lwr-card">
                <h3>Conditional deadline</h3>
                <p>Blocked task or human review.</p>
              </div>
            </div>
            <p className="lwr-key-line">A field can be textually correct but operationally risky.</p>
          </div>
        </section>

        <section id="example" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Concrete Example</div>
            <h2>The date is not always the deadline</h2>
            <p className="lwr-lede">
              “Plaintiff EBT within 45 days after receipt of outstanding medical records.”
            </p>
            <p className="lwr-lede" style={{ fontSize: 17 }}>
              This pattern shows why conditional deadlines cannot be treated as fixed dates. If the
              trigger event is unknown, the system should not calculate a final deadline.
            </p>
            <div className="lwr-compare" style={{ marginTop: 18 }}>
              <div className="lwr-card lwr-card-bad">
                <div className="lwr-label">Bad output</div>
                <h3>Calculates a fixed deadline</h3>
                <pre className="lwr-code">{`{
  "ebtDeadline": "2026-07-30",
  "confidence": 0.91
}`}</pre>
              </div>
              <div className="lwr-card lwr-card-good">
                <div className="lwr-label">Safer output</div>
                <h3>Blocks until trigger is known</h3>
                <pre className="lwr-code">{`{
  "ebtDeadline": null,
  "routing": "blocked_task",
  "reason": "Trigger event is unknown"
}`}</pre>
              </div>
            </div>
            <p className="lwr-key-line">
              The question is not “Did the model extract the date?” The question is “Is the system
              allowed to use this extraction to change the workflow?”
            </p>
          </div>
        </section>

        <section id="architecture" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Technical Architecture</div>
            <h2>Layered research architecture</h2>
            <PipelineSteps steps={ARCHITECTURE_LAYERS} />
          </div>
        </section>

        <section id="confidence" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Confidence Routing</div>
            <h2>Confidence is a gate, not a score</h2>
            <p className="lwr-lede">
              In legal workflows, confidence should mean: this extracted field is safe enough to
              trigger the next workflow step.
            </p>
            <div className="lwr-route" style={{ marginTop: 18 }}>
              {[
                ['Auto-apply', 'Low-risk, grounded, agreed fields.'],
                ['Block', 'Missing trigger event or unsafe dependency.'],
                ['Flag', 'Ambiguous source, partial agreement, or incomplete context.'],
                [
                  'Human approval',
                  'High-risk deadline, source conflict, or procedural recommendation.',
                ],
              ].map(([title, body]) => (
                <div key={title} className="lwr-card">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <div className="lwr-grid lwr-grid-3" style={{ marginTop: 18 }}>
              <div className="lwr-card">
                <h3>Agreement</h3>
                <p>Independent extractors converge on the same field.</p>
              </div>
              <div className="lwr-card">
                <h3>Grounding</h3>
                <p>The value traces to source text and supporting evidence.</p>
              </div>
              <div className="lwr-card">
                <h3>Risk</h3>
                <p>Deadlines require a higher review standard than labels.</p>
              </div>
            </div>
            <p className="lwr-key-line">
              A deadline should have a higher review standard than a document label.
            </p>
          </div>
        </section>

        <section id="arbitration" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Model Arbitration</div>
            <h2>Using disagreement as signal</h2>
            <div className="lwr-tabs">
              {ARBITRATION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`lwr-tab ${arbitrationTab === tab.id ? 'lwr-tab-active' : ''}`}
                  onClick={() => setArbitrationTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="lwr-card">
              <h3>{activeArbitration.title}</h3>
              <p>{activeArbitration.body}</p>
            </div>
            <div className="lwr-grid lwr-grid-3" style={{ marginTop: 18 }}>
              <div className="lwr-card">
                <h3>Converged</h3>
                <p>Route forward if risk allows.</p>
              </div>
              <div className="lwr-card">
                <h3>Partial convergence</h3>
                <p>Flag for review or additional context.</p>
              </div>
              <div className="lwr-card">
                <h3>Entrenched disagreement</h3>
                <p>Escalate to human review.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="authority" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Authority Ontology</div>
            <h2>Legal AI needs source authority, not just retrieval</h2>
            <p className="lwr-lede">
              Simple RAG asks: what rule is relevant? Legal workflow intelligence asks: what source
              controls?
            </p>
            <div className="lwr-authority" style={{ marginTop: 24 }}>
              {AUTHORITY_RANKS.map((rank, index) => (
                <div key={rank.title}>
                  <div className="lwr-authority-row">
                    <div className="lwr-rank">Rank {index + 1}</div>
                    <div className="lwr-card">
                      <h3>{rank.title}</h3>
                      <p>{rank.description}</p>
                    </div>
                  </div>
                  {index < AUTHORITY_RANKS.length - 1 && (
                    <div className="lwr-arrow-down">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="memory" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Human Review + Procedural Memory</div>
            <h2>Human review should teach the system</h2>
            <p className="lwr-lede">
              When a human resolves an ambiguity, the system should save more than the corrected
              value. It should save how the ambiguity was resolved.
            </p>
            <div className="lwr-grid lwr-grid-4" style={{ marginTop: 18 }}>
              {[
                ['Disputed field', 'What field failed or conflicted.'],
                ['Source text', 'The exact language that created ambiguity.'],
                ['Human correction', 'The operational resolution and reason.'],
                ['Workflow rule', 'How future similar cases should route.'],
              ].map(([title, body]) => (
                <div key={title} className="lwr-card">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <p className="lwr-key-line">
              The system should not make humans correct the same ambiguity twice.
            </p>
          </div>
        </section>

        <section id="evals" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Prompt + Eval Infrastructure</div>
            <h2>Testing workflow outcomes, not just JSON</h2>
            <div className="lwr-grid lwr-grid-2" style={{ marginTop: 18 }}>
              <div className="lwr-card">
                <h3>Eval types</h3>
                <p>
                  Field extraction, source grounding, model agreement, arbitration convergence,
                  routing correctness, workflow impact, memory retrieval, review efficiency.
                </p>
              </div>
              <div className="lwr-card">
                <h3>Metrics</h3>
                <p>
                  False auto-apply rate, high-risk review rate, arbitration success, human review
                  reduction, reused ambiguity memories.
                </p>
              </div>
            </div>
            <p className="lwr-key-line">
              The real metric is review efficiency under risk constraints.
            </p>
          </div>
        </section>

        <section id="agent-safe" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Agent-Safe Architecture</div>
            <h2>Preventing AI workflow drift</h2>
            <div className="lwr-big-card">
              <p className="lwr-quote" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
                Workers produce candidates. Validators check candidates. State machines advance
                workflows. Only approved states write verified records.
              </p>
            </div>
            <PipelineSteps steps={AGENT_PIPELINE_STEPS} />
          </div>
        </section>

        <section id="repos" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">GitHub Project Ecosystem</div>
            <h2>Connected research repos</h2>
            <div className="lwr-grid lwr-grid-3" style={{ marginTop: 18 }}>
              {RESEARCH_REPOS.map((repo) => (
                <div key={repo.name} className="lwr-card">
                  <h3>{repo.name}</h3>
                  <p>{repo.description}</p>
                  <a className="lwr-blog-link" href={repo.url} target="_blank" rel="noreferrer">
                    Open repo →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="blogs" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Study Blog Trail</div>
            <h2>Study blog trail</h2>
            <div className="lwr-grid lwr-grid-2" style={{ marginTop: 18 }}>
              {studyBlogLinks.map((blog) => (
                <div key={blog.title} className="lwr-card">
                  <h3>{blog.title}</h3>
                  <p>{blog.theme}</p>
                  <Link className="lwr-blog-link" to={blog.href}>
                    Read blog →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="status" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">Current Status</div>
            <h2>Research prototype, not legal advice</h2>
            <div className="lwr-status" style={{ marginTop: 18 }}>
              {[
                ['Stage', 'Independent research prototype'],
                [
                  'Data',
                  'Anonymized litigation-operations observations; synthetic examples used for public demonstration.',
                ],
                ['Scope', 'Legal workflow automation research'],
                ['Production', 'Not legal decision-making software'],
                ['Focus', 'Workflow safety + evals'],
              ].map(([label, value]) => (
                <div key={label} className="lwr-status-item">
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="lessons" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-kicker">What I Learned</div>
            <h2>The case study takeaway</h2>
            <div className="lwr-grid lwr-grid-3" style={{ marginTop: 18 }}>
              {[
                ['Extraction is not enough', 'Fields can be textually correct but unsafe to use.'],
                ['RAG is not enough', 'A retrieved rule can be real but not controlling.'],
                ['Confidence is routing', 'The system must decide when to act, block, or review.'],
                [
                  'Review becomes memory',
                  'Corrections should become reusable procedural intelligence.',
                ],
                [
                  'Context must be controlled',
                  'Memory needs source, scope, freshness, and supersession.',
                ],
                [
                  'Architecture matters',
                  'Agent-built systems need boundaries, logs, evals, validators, and state control.',
                ],
              ].map(([title, body]) => (
                <div key={title} className="lwr-card">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="lwr-section">
          <div className="lwr-wrap">
            <div className="lwr-big-card">
              <h2>Researching safer legal AI workflows</h2>
              <p className="lwr-lede">
                This project brings together document intelligence, legal workflow modeling,
                confidence gates, human review, procedural memory, and agent-safe architecture.
              </p>
              <div className="lwr-btn-row" style={{ marginTop: 20 }}>
                <a
                  className="lwr-btn lwr-btn-primary"
                  href={LEGAL_WORKFLOW_GITHUB}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Main GitHub Repo
                </a>
                <Link className="lwr-btn" to={confidenceBlogHref}>
                  Read the Confidence Blog
                </Link>
                <Link className="lwr-btn" to={BLOGS_INDEX_PATH}>
                  View All Study Blogs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lwr-footer">
        <div className="lwr-wrap">
          <p>© {new Date().getFullYear()} Design Baker · Legal Workflow Research Case Study</p>
          <p style={{ marginTop: 8 }}>{SOURCES_FOOTER}</p>
        </div>
      </footer>
    </div>
  );
}
