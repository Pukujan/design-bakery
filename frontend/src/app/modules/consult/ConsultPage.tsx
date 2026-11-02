import { useEffect, useState, type FormEvent } from 'react';
import { copilot } from '../copilot/store';
import { getAuthApiBaseUrl } from '../../lib/adminToken';
import '../lab/lab.css';
import './consult.css';

/** The public Google Calendar booking page for free 30-minute consultations. */
const BOOKING_URL = 'https://calendar.app.google/3G3hHBwtsxisSaoz9';
const AREAS = ['AI engineering', 'Product design', 'Marketing', 'Full-stack development'] as const;
const LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/pujan3645' },
  { label: 'GitHub', url: 'https://github.com/pukujan' },
];

/** The consultation page: choose an area, say what it is about, then pick a time. */
export function ConsultPage() {
  const [area, setArea] = useState<(typeof AREAS)[number] | null>(null);
  const [topic, setTopic] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${getAuthApiBaseUrl() ?? ''}/api/contact/config`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ enabled?: boolean }> : null)
      .then((config) => { if (active) setDeliveryAvailable(config?.enabled === true); })
      .catch(() => { if (active) setDeliveryAvailable(false); });
    return () => { active = false; };
  }, []);

  // Booking from the chat: the copilot asks for what it still needs and then shows the booking card.
  const bookFromChat = () => {
    const question = `Please book me a free consultation through chat about ${area ?? 'my work'}.${topic.trim() ? ` ${topic.trim()}` : ''}`;
    copilot.setOpen(true);
    void copilot.send(question, { path: window.location.pathname, title: document.title });
  };

  const bookLabel = 'Book a free consultation';

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliveryAvailable || isSending) return;
    setIsSending(true);
    setContactStatus('Sending your message…');
    try {
      const response = await fetch(`${getAuthApiBaseUrl() ?? ''}/api/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ area, replyEmail, message: topic }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (!response.ok || result?.ok !== true) {
        setContactStatus(result?.message || 'Your message could not be sent. Your details are still here; please try again later.');
        return;
      }
      setContactStatus(result.message || 'Your message was sent. Thanks — Pujan will be in touch.');
    } catch {
      setContactStatus('Your message could not be sent. Your details are still here; please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="lab-root consult">
      <main className="consult-main">
        <span className="consult-intro">Free 30-minute video consultations</span>
        <h1 className="consult-title">
          <button type="button" className="consult-title-cta" onClick={() => document.getElementById('consult-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span>Talk to <em>me.</em></span>
          </button>
        </h1>

        <section className="consult-section" aria-labelledby="consult-area">
          <h2 id="consult-area" className="consult-label">
            <span>
              What is it about
            </span>
          </h2>
          <ul className="consult-areas">
            {AREAS.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  className="consult-area"
                  aria-pressed={area === item}
                  onClick={() => {
                    setArea(item);
                    requestAnimationFrame(() => document.getElementById('consult-message')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                  }}
                >
                  <span className="consult-index">0{index + 1}</span>
                  <span className="consult-area-name">
                    {item}
                  </span>
                  <span className="consult-area-mark" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <form className="consult-contact-form" onSubmit={sendMessage}>
          <div id="consult-message" className="consult-message-anchor" />
          <p className="consult-selected-area">{area ? `About ${area}` : 'Tell me what you are working on'}</p>
          <label className="consult-label" htmlFor="consult-topic">Tell me more</label>
          <textarea
            id="consult-topic"
            className="consult-topic"
            rows={3}
            maxLength={600}
            required
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What are you building, and what is stuck?"
          />
          <label className="consult-label" htmlFor="consult-email">Your email</label>
          <input
            id="consult-email"
            className="consult-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={replyEmail}
            onChange={(event) => setReplyEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <button type="submit" className="consult-send" disabled={!deliveryAvailable || isSending}>{isSending ? 'Sending…' : deliveryAvailable ? 'Send message to Pujan' : 'Message delivery coming soon'} <span aria-hidden="true">↗</span></button>
          <p className="consult-status" role="status" aria-live="polite">{contactStatus || (deliveryAvailable ? 'Send a note directly to Pujan.' : 'This form is not sending messages yet. Book a free consultation below or use the chat.')}</p>
        </form>

        <section className="consult-section consult-book-section" aria-labelledby="consult-book-label">
          <h2 id="consult-book-label" className="consult-label">
            <span>
              Pick a time
            </span>
          </h2>
          <a className="consult-book" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            <span>
              {bookLabel}
            </span>
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
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
