import { useEffect, useRef, useState, type FormEvent } from 'react';
import { copilot } from '../copilot/store';
import '../lab/lab.css';
import './consult.css';

/** The public Google Calendar booking page for free 30-minute consultations. */
const BOOKING_URL = 'https://calendar.app.google/3G3hHBwtsxisSaoz9';

/**
 * PLACEHOLDER: the server endpoint that will send the message through Gmail. It is not built yet.
 * While this is null, "Leave a message" is shown as not open yet and nothing can be sent. Replace it
 * with the route URL once the server-side Gmail integration exists.
 */
const MESSAGE_ENDPOINT: string | null = null;

const AREAS = [
  { name: 'AI engineering', hint: 'RAG, agents, evals, document workflows' },
  { name: 'Product design', hint: 'Interfaces and flows people can follow' },
  { name: 'Marketing', hint: 'Positioning, launch pages, content' },
  { name: 'Full-stack development', hint: 'APIs, apps and the plumbing between' },
] as const;
type Area = (typeof AREAS)[number]['name'];
type Step = 'need' | 'way' | 'message';
type Status = 'idle' | 'sending' | 'sent' | 'failed';

const LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/pujan3645' },
  { label: 'GitHub', url: 'https://github.com/pukujan' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEP_ORDER: Step[] = ['need', 'way', 'message'];

/**
 * The contact page as a guided flow, one question at a time: what you need, how you want to talk, and
 * (once sending is connected) a short message. Booking and the chat work today; nothing here pretends
 * a message was delivered.
 */
export function ConsultPage() {
  const [step, setStep] = useState<Step>('need');
  const [area, setArea] = useState<Area | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [problem, setProblem] = useState('');
  const [booked, setBooked] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Each step change moves focus to its question, so keyboard and screen-reader users follow the flow.
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const go = (next: Step) => {
    moved.current = true;
    setProblem('');
    setStep(next);
  };

  const choose = (name: Area) => {
    setArea(name);
    go('way');
  };

  const askTheChat = () => {
    const about = area ? area.toLowerCase() : 'your work';
    copilot.setOpen(true);
    void copilot.send(`How can you help with ${about}?`, { path: window.location.pathname, title: document.title });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending' || !MESSAGE_ENDPOINT) return;
    const missing = !EMAIL_PATTERN.test(email.trim())
      ? 'Enter an email address I can reply to.'
      : !message.trim()
        ? 'Write a short message first.'
        : '';
    setProblem(missing);
    if (missing) return;

    setStatus('sending');
    try {
      const response = await fetch(MESSAGE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: area, email: email.trim(), message: message.trim() }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      setStatus('sent');
      setMessage('');
    } catch {
      setStatus('failed');
    }
  };

  const sending = status === 'sending';
  const position = STEP_ORDER.indexOf(step);

  return (
    <div className="lab-root consult">
      <main className="consult-main">
        <header className="consult-head">
          <p className="consult-intro">Free 30-minute video consultations</p>
          <h1 className="consult-title">
            Talk to <em>me.</em>
          </h1>
        </header>

        <section className="consult-flow" aria-label="Get in touch">
          <ol className="consult-steps" aria-label="Progress">
            {STEP_ORDER.map((name, index) => (
              <li
                key={name}
                className={index <= position ? 'is-reached' : undefined}
                aria-current={index === position ? 'step' : undefined}
              >
                <span className="sr-only">{`Step ${index + 1} of ${STEP_ORDER.length}`}</span>
              </li>
            ))}
          </ol>

          {step !== 'need' && (
            <div className="consult-recap">
              {area && <span className="consult-chip">{area}</span>}
              <button type="button" className="consult-back" onClick={() => go(step === 'message' ? 'way' : 'need')}>
                ← Back
              </button>
            </div>
          )}

          {step === 'need' && (
            <div className="consult-step">
              <h2 ref={headingRef} tabIndex={-1} className="consult-question">
                What do you need help with?
              </h2>
              <div className="consult-tiles">
                {AREAS.map((item) => (
                  <button key={item.name} type="button" className="consult-tile" onClick={() => choose(item.name)}>
                    <span className="consult-tile-name">{item.name}</span>
                    <span className="consult-tile-hint">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'way' && (
            <div className="consult-step">
              <h2 ref={headingRef} tabIndex={-1} className="consult-question">
                How would you like to talk?
              </h2>
              <div className="consult-tiles">
                <a
                  className="consult-tile consult-tile--primary"
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setBooked(true)}
                >
                  <span className="consult-tile-name">Book a free 30-minute call</span>
                  <span className="consult-tile-hint">Pick a time that suits you. Opens my calendar.</span>
                </a>
                <button type="button" className="consult-tile" data-copilot-open onClick={askTheChat}>
                  <span className="consult-tile-name">Ask the AI right now</span>
                  <span className="consult-tile-hint">Instant answers about this, no waiting.</span>
                </button>
                <button
                  type="button"
                  className="consult-tile"
                  disabled={!MESSAGE_ENDPOINT}
                  onClick={() => go('message')}
                >
                  <span className="consult-tile-name">Leave a message</span>
                  <span className="consult-tile-hint">
                    {MESSAGE_ENDPOINT ? 'I will reply by email.' : 'Not open yet. Use a call or the chat for now.'}
                  </span>
                </button>
              </div>
              {booked && (
                <p className="consult-note" role="status">
                  My calendar opened in a new tab. Pick any slot and you are done.
                </p>
              )}
            </div>
          )}

          {step === 'message' && (
            <form className="consult-step" onSubmit={submit} noValidate>
              <h2 ref={headingRef} tabIndex={-1} className="consult-question">
                Where should I reply?
              </h2>

              {status === 'sent' ? (
                <div className="consult-result" role="status">
                  <p>Message sent. I&apos;ll reply to your email.</p>
                  <button type="button" className="consult-again" onClick={() => setStatus('idle')}>
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <label htmlFor="consult-email" className="consult-field-label">
                    Your email
                  </label>
                  <input
                    id="consult-email"
                    className="consult-input"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    disabled={sending}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                  />
                  <label htmlFor="consult-message" className="consult-field-label">
                    What are you building, and what is stuck?
                  </label>
                  <textarea
                    id="consult-message"
                    className="consult-input consult-input--area"
                    rows={4}
                    maxLength={1000}
                    value={message}
                    disabled={sending}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  {problem && (
                    <p className="consult-problem" role="alert">
                      {problem}
                    </p>
                  )}
                  {status === 'failed' && (
                    <p className="consult-problem" role="alert">
                      Something went wrong and nothing was sent. Your message is still here, so you can try again.
                    </p>
                  )}
                  <button type="submit" className="consult-send" disabled={sending}>
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </>
              )}
            </form>
          )}
        </section>

        <nav className="consult-links" aria-label="Elsewhere">
          {LINKS.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
