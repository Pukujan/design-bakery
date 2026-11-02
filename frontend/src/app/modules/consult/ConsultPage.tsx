import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
const EASE = [0.2, 0.7, 0.1, 1] as const;

/** The consultation page: pick an area, say what it is about, then pick a time. */
export function ConsultPage() {
  const [area, setArea] = useState<(typeof AREAS)[number] | null>(null);
  const [topic, setTopic] = useState('');
  const reduceMotion = useReducedMotion();
  const rise = reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  // Booking from the chat: the copilot asks for what it still needs and then shows the booking card.
  const bookFromChat = () => {
    const question = `Please book me a free consultation about ${area ?? 'my work'}.${topic.trim() ? ` ${topic.trim()}` : ''}`;
    copilot.setOpen(true);
    void copilot.send(question, { path: window.location.pathname, title: document.title });
  };

  return (
    <div className="lab-root consult">
      <main className="consult-main">
        <motion.p className="lab-mono consult-kicker" {...rise} transition={{ duration: 0.6, ease: EASE }}>
          Free · 30 minutes · video call
        </motion.p>
        <motion.h1 className="consult-title" {...rise} transition={{ duration: 0.9, delay: 0.1, ease: EASE }}>
          Let's talk about <em>your</em> project.
        </motion.h1>

        <motion.section className="consult-step" {...rise} transition={{ duration: 0.8, delay: 0.25, ease: EASE }}>
          <h2 className="lab-mono">1 · What is it about?</h2>
          <div className="consult-areas" role="group" aria-label="Consultation area">
            {AREAS.map((item) => (
              <button
                key={item}
                type="button"
                className="consult-area"
                aria-pressed={area === item}
                onClick={() => setArea(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section className="consult-step" {...rise} transition={{ duration: 0.8, delay: 0.35, ease: EASE }}>
          <h2 className="lab-mono">2 · Tell me a little</h2>
          <label htmlFor="consult-topic" className="sr-only">
            What you are working on
          </label>
          <textarea
            id="consult-topic"
            className="consult-topic"
            rows={3}
            maxLength={600}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What are you building, and what is stuck?"
          />
        </motion.section>

        <motion.section className="consult-step" {...rise} transition={{ duration: 0.8, delay: 0.45, ease: EASE }}>
          <h2 className="lab-mono">3 · Pick a time</h2>
          <div className="consult-actions">
            <a className="lab-chip lab-chip--solid consult-book" href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-cursor="Book">
              {area ? `Pick a time for ${area} ↗` : 'Pick a time ↗'}
            </a>
            <button type="button" className="lab-chip consult-ask" onClick={bookFromChat}>
              Book from the chat
            </button>
          </div>
          <p className="consult-note">You choose the time on the next page. Nothing is booked until you pick one.</p>
        </motion.section>

        <nav className="consult-links lab-mono" aria-label="Elsewhere">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target={link.url.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            >
              {link.label} ↗
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
