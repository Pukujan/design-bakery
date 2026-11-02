import { useState } from 'react';
import { copilot } from '../copilot/store';
import '../lab/lab.css';
import './consult.css';

/** The public Google Calendar booking page for free 30-minute consultations. */
const BOOKING_URL = 'https://calendar.app.google/3G3hHBwtsxisSaoz9';
const AREAS = ['AI engineering', 'Product design', 'Marketing', 'Full-stack development'] as const;
const LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/pujan3645' },
  { label: 'GitHub', url: 'https://github.com/pukujan' },
  { label: 'Email', url: 'mailto:pujan3645@gmail.com' },
];

/** The consultation page: choose an area, say what it is about, then pick a time. */
export function ConsultPage() {
  const [area, setArea] = useState<(typeof AREAS)[number] | null>(null);
  const [topic, setTopic] = useState('');

  // Booking from the chat: the copilot asks for what it still needs and then shows the booking card.
  const bookFromChat = () => {
    const question = `Please book me a free consultation about ${area ?? 'my work'}.${topic.trim() ? ` ${topic.trim()}` : ''}`;
    copilot.setOpen(true);
    void copilot.send(question, { path: window.location.pathname, title: document.title });
  };

  return (
    <div className="lab-root consult">
      <main className="consult-main">
        <p className="consult-intro">Free 30-minute video consultations</p>
        <h1 className="consult-title">
          Talk to <em>me.</em>
        </h1>

        <section className="consult-section" aria-labelledby="consult-area">
          <h2 id="consult-area" className="consult-label">
            What is it about
          </h2>
          <ul className="consult-areas">
            {AREAS.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  className="consult-area"
                  aria-pressed={area === item}
                  onClick={() => setArea(item)}
                >
                  <span className="consult-index">0{index + 1}</span>
                  <span className="consult-area-name">{item}</span>
                  <span className="consult-area-mark" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="consult-section" aria-labelledby="consult-topic-label">
          <h2 id="consult-topic-label" className="consult-label">
            Tell me more
          </h2>
          <label htmlFor="consult-topic" className="sr-only">
            What you are working on
          </label>
          <textarea
            id="consult-topic"
            className="consult-topic"
            rows={2}
            maxLength={600}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What are you building, and what is stuck?"
          />
        </section>

        <section className="consult-section consult-book-section" aria-labelledby="consult-book-label">
          <h2 id="consult-book-label" className="consult-label">
            Pick a time
          </h2>
          <a className="consult-book" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            {area ? `Book ${area.toLowerCase()}` : 'Book a time'}
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
