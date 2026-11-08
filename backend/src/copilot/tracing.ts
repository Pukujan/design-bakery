/**
 * Copilot traces to Phoenix through Octo, the way nyc-map-agent sends them
 * (server/lib/tracing.ts): one trace per turn, an LLM span and a span per tool call,
 * OpenInference span kinds, grouped by the visitor's session. Spans are written after
 * the turn from recorded timings, so nothing sits on the request path. Off unless
 * OCTO_API_KEY and OCTO_WORKSPACE_ID are set, or with OCTO_TRACES=off. Emails and
 * phone numbers are masked before they leave.
 */
import { context, trace, type Attributes, type Span, type Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE = /\+?\d[\d ()-]{8,}\d/g;
export const mask = (text: string) => text.replace(EMAIL, '[email]').replace(PHONE, '[phone]');

let tracer: Tracer | null | undefined;
function getTracer(): Tracer | null {
  if (tracer !== undefined) return tracer;
  const key = process.env.OCTO_API_KEY;
  const ws = process.env.OCTO_WORKSPACE_ID;
  if (!key || !ws || process.env.OCTO_TRACES === 'off') return (tracer = null);
  const base = (process.env.OCTO_API_BASE ?? 'https://octodb.design-bakery.com').replace(/\/+$/, '').replace(/\/api$/, '');
  const exporter = new OTLPTraceExporter({ url: `${base}/api/workspaces/${ws}/otel/v1/traces`, headers: { authorization: `Bearer ${key}` } });
  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'design-bakery-copilot' }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });
  return (tracer = provider.getTracer('design-bakery-copilot'));
}

type Step = { name: string; start: number; end?: number; ok?: boolean; input?: string; output?: string };

/** Timings for one turn, written as a trace when it finishes. */
export class TurnTrace {
  readonly start = Date.now();
  model = 'none';
  /** Which routine answered (routines.ts), or 'model' when none did: hit rate and latency by routine read from this. */
  routine = 'model';
  input = '';
  output = '';
  /** 'text' or 'voice'. */
  channel = 'text';
  /** The lane that answered (lanes/): strong, hybrid or small. */
  lane = '';
  /** The visitor's address is on the owner's rate-limit exemption list (COPILOT_RATE_EXEMPT_IPS). */
  exempt = false;
  /** The page moves and chips this turn sent, one word each, so a trace shows what the visitor was shown. */
  actions: string[] = [];
  /** What cite_section was asked to cite: path#anchor when the guard let it through, path!reason when it did not. */
  citations: string[] = [];
  /** Estimated size of the prompt sent (persona, brief, news, summary, history), and what was left out of it. */
  contextTokens = 0;
  summaryUsed = false;
  /** Turns not sent verbatim: cut by the token budget plus those the browser's summary stands for. */
  historyDropped = 0;
  historyKept = 0;
  inputTokens = 0;
  outputTokens = 0;
  /** Why the model stopped (stop, length, tool-calls...), and whether the reply was cut off and trimmed to a whole sentence. */
  finishReason = 'unknown';
  /** TASK-DB-0142: how the turn's passages were found: 'rag', 'rerank-off', or 'brief' when Octo did not answer. */
  retrieval = 'none';
  retrievalMs = 0;
  /** The retrieved sections' addresses, best first. */
  retrieved: string[] = [];
  truncated = false;
  /** The tools the model was offered this turn, after the channel, the booking step and the lane narrowed them (copilot-spec.md O-1 to O-4). */
  offered: string[] = [];
  private steps = new Map<string, Step>();

  constructor(readonly session: string) {}

  stepStart(id: string, name: string, input: unknown) {
    this.steps.set(id, { name, start: Date.now(), input: JSON.stringify(input ?? {}).slice(0, 2000) });
  }

  stepEnd(id: string, ok: boolean, output?: unknown) {
    const step = this.steps.get(id);
    if (step) Object.assign(step, { end: Date.now(), ok, output: JSON.stringify(output ?? null).slice(0, 2000) });
  }

  finish(status: 'done' | 'error' | 'limited') {
    const t = getTracer();
    if (!t) return;
    const end = Date.now();
    const open = (name: string, start: number, attrs: Attributes, parent?: Span) => {
      const ctx = parent ? trace.setSpan(context.active(), parent) : context.active();
      for (const [k, v] of Object.entries(attrs)) if (typeof v === 'string') attrs[k] = mask(v);
      return t.startSpan(name, { startTime: start, attributes: { 'session.id': this.session, ...attrs } }, ctx);
    };
    const root = open('copilot.turn', this.start, {
      'openinference.span.kind': 'AGENT',
      'input.value': this.input,
      'output.value': this.output,
      'copilot.status': status,
      // Where the answer came from: a saved answer (cache:<intent>) or a model, and over text or a call.
      'copilot.model': this.model,
      'copilot.source': this.model.startsWith('cache:') ? 'cache' : 'model',
      'copilot.routine': this.routine,
      ...(this.exempt ? { 'copilot.exempt': true } : {}),
      'copilot.latency_ms': end - this.start,
      'copilot.finish_reason': this.finishReason,
      'copilot.truncated': this.truncated,
      'copilot.channel': this.channel,
      'copilot.lane': this.lane,
      'copilot.actions': this.actions.join(' '),
      'copilot.offered': this.offered.join(' '),
      'copilot.citations': this.citations.join(' | '),
      'copilot.context_tokens': this.contextTokens,
      'copilot.summary_used': this.summaryUsed,
      'copilot.history_dropped': this.historyDropped,
      'copilot.history_kept': this.historyKept,
      'copilot.retrieval': this.retrieval,
      'copilot.retrieval_ms': this.retrievalMs,
      'copilot.retrieved': this.retrieved.join(' '),
    });
    const llm = open(
      'llm',
      this.start,
      {
        'openinference.span.kind': 'LLM',
        'llm.model_name': this.model,
        'llm.token_count.prompt': this.inputTokens,
        'llm.token_count.completion': this.outputTokens,
      },
      root,
    );
    llm.end(end);
    for (const step of this.steps.values()) {
      const span = open(step.name, step.start, { 'openinference.span.kind': 'TOOL', 'tool.name': step.name, 'input.value': step.input ?? '', 'output.value': step.output ?? '' }, root);
      if (step.ok === false) span.setStatus({ code: 2 });
      span.end(step.end ?? end);
    }
    if (status === 'error') root.setStatus({ code: 2 });
    root.end(end);
  }
}
