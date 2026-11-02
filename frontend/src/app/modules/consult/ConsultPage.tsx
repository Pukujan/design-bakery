import { useState, type FormEvent } from 'react';
import { copilot } from '../copilot/store';
import { FlowText } from '../lab/FlowText';
import '../lab/lab.css';
import './consult.css';

/** The public Google Calendar booking page for free 30-minute consultations. */
const BOOKING_URL = 'https://calendar.app.google/3G3hHBwtsxisSaoz9';

/**
 * PLACEHOLDER: the server endpoint that will send the message through Gmail. It is not built yet.
 * While this is null, the form says it is not connected and sends nothing. Replace it with the
 * route URL once the server-side Gmail integration exists.
 */
const MESSAGE_ENDPOINT: string | null = null;

const AREAS = ['AI engineering', 'Product design', 'Marketing', 'Full-stack development'] as const;
type Area = (typeof AREAS)[number];
type Status = 'idle' | 'sending' | 'sent' | 'unavailable' | 'failed';

const LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/pujan3645' },
  { label: 'GitHub', url: 'https://github.com/pukujan' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The contact page: choose a service, leave an email and a message, or book a call directly. */
export function ConsultPage() {
  const [area, setArea] = useState<Area | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [problem, setProblem] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    const missing = !area
      ? 'Choose the service you need.'
      : !EMAIL_PATTERN.test(email.trim())
        ? 'Enter an email address I can reply to.'
        : !message.trim()
          ? 'Write a short message first.'
          : '';
    setProblem(missing);
    if (missing) return;

    if (!MESSAGE_ENDPOINT) {
      setStatus('unavailable');
      return;
    }

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

  const startAgain = () => {
    setStatus('idle');
    setProblem('');
  };

  // Booking from the chat: the copilot gets the service and the message, then shows the booking card.
  const bookFromChat = () => {
    const detail = message.trim() ? ` ${message.trim()}` : '';
    const question = `Please book me a free consultation${area ? ` about ${area.toLowerCase()}` : ''}.${detail}`;
    copilot.setOpen(true);
    void copilot.send(question, { path: window.location.pathname, title: document.title });
  };

  const sending = status === 'sending';

  return (
    <div className="lab-root consult">
      <main className="consult-main">
        <header className="consult-head">
          <p className="consult-intro">Free 30-minute video consultations</p>
          <h1 className="consult-title">
            <FlowText as="span" text="Talk to me.">
              Talk to <em>me.</em>
            </FlowText>
          </h1>
        </header>

        <form className="consult-form" onSubmit={submit} noValidate aria-describedby="consult-connection">
          <fieldset className="consult-section consult-fieldset" disabled={sending}>
            <legend className="consult-label">
              What is it about
            </legend>
            <div className="consult-areas" role="radiogroup" aria-label="Service">
              {AREAS.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={area === item}
                  className="consult-area"
                  onClick={() => setArea(item)}
                >
                  <span className="consult-index">0{index + 1}</span>
                  <span className="consult-area-name">{item}</span>
                  <span className="consult-area-mark" aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>

          <section className="consult-section" aria-labelledby="consult-message-label">
            <h2 id="consult-message-label" className="consult-label">
              Send a message to Pujan
            </h2>

            <div className="consult-field">
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
            </div>

            <div className="consult-field">
              <label htmlFor="consult-message" className="consult-field-label">
                Message
              </label>
              <textarea
                id="consult-message"
                className="consult-topic"
                rows={4}
                maxLength={1000}
                value={message}
                disabled={sending}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What are you building, and what is stuck?"
              />
            </div>

            <p id="consult-connection" className="consult-note">
              Sending is not connected yet. Messages are not delivered until Gmail is set up.
            </p>

            {problem && (
              <p className="consult-problem" role="alert">
                {problem}
              </p>
            )}

            {status === 'sent' ? (
              <div className="consult-result consult-result--ok" role="status">
                <p>Message sent. I&apos;ll reply to your email.</p>
                <button type="button" className="consult-again" onClick={startAgain}>
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <button type="submit" className="consult-submit" disabled={sending}>
                  {sending ? 'Sending…' : 'Send message to Pujan'}
                </button>
                {status === 'unavailable' && (
                  <div className="consult-result consult-result--error" role="alert">
                    <p>Message not sent. Sending is not connected yet, so nothing was delivered.</p>
                    <p>Book a call below instead, or try again once sending is live.</p>
                  </div>
                )}
                {status === 'failed' && (
                  <div className="consult-result consult-result--error" role="alert">
                    <p>Message not sent. Something went wrong on the way. Your message is still here, so you can try again.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </form>

        <section className="consult-section consult-book-section" aria-labelledby="consult-book-label">
          <h2 id="consult-book-label" className="consult-label">
            Or pick a time
          </h2>
          <a className="consult-book" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            Book a free 30-minute call
            <span aria-hidden="true"> →</span>
          </a>
          <button type="button" className="consult-chat" onClick={bookFromChat}>
            or book through the chat
          </button>
        </section>

        <nav className="consult-links" aria-label="Elsewhere">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target={link.url.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
