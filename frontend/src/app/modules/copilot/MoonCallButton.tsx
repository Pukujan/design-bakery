import { useId } from 'react';
import { Mic, PhoneOff } from 'lucide-react';
import { voice, useVoice } from './voice';
import { useReplyNudge } from './replyPeek';

/**
 * The voice call button: the moon mascot, dozing in a soft glow until the visitor comes near, then awake and smiling.
 * It is the first thing in the composer's actions, so a call reads as a first-class way to talk, not a side option.
 * Connecting, the moon thinks; on a call the button turns into End call.
 */
export function MoonCallButton() {
  const { status } = useVoice();
  const gradient = useId();
  const idle = status === 'idle';
  const nudge = useReplyNudge();
  return (
    <button
      type="button"
      className="cp-call"
      data-status={status}
      data-nudge={nudge || undefined}
      aria-label={idle ? 'Talk to AI Pujan by voice' : 'End voice call'}
      onPointerEnter={() => voice.preload()}
      onFocus={() => voice.preload()}
      onClick={() => idle ? void voice.start() : voice.stop()}
    >
      {status === 'connected' ? (
        <PhoneOff size={16} className="cp-call-end" aria-hidden />
      ) : (
        <span className="cp-call-moon" aria-hidden>
          <svg viewBox="0 0 48 48" width="30" height="30">
            <defs>
              <radialGradient id={gradient} cx="35%" cy="30%" r="80%">
                <stop offset="0" stopColor="#fffdf3" />
                <stop offset="0.65" stopColor="#efe6c6" />
                <stop offset="1" stopColor="#d6c993" />
              </radialGradient>
            </defs>
            <circle cx="24" cy="24" r="21" fill={`url(#${gradient})`} stroke="rgb(11 11 10 / 0.65)" strokeWidth="1.4" />
            <circle cx="13.5" cy="15.5" r="3.2" fill="#d2c58f" opacity="0.75" />
            <circle cx="36" cy="14" r="2" fill="#d2c58f" opacity="0.7" />
            <ellipse className="cp-call-blush" cx="13.5" cy="29" rx="3.4" ry="2.1" fill="#ff9fb0" />
            <ellipse className="cp-call-blush" cx="34.5" cy="29" rx="3.4" ry="2.1" fill="#ff9fb0" />
            <path className="cp-call-sleepy" d="M16 24.5 Q18.5 26.5 21 24.5 M27 24.5 Q29.5 26.5 32 24.5" fill="none" stroke="#2a2418" strokeWidth="1.8" strokeLinecap="round" />
            <g className="cp-call-awake">
              <ellipse cx="18.5" cy="23.5" rx="2.2" ry="2.9" fill="#2a2418" />
              <ellipse cx="29.5" cy="23.5" rx="2.2" ry="2.9" fill="#2a2418" />
              <circle cx="19.3" cy="22.4" r="0.8" fill="#fffdf3" />
              <circle cx="30.3" cy="22.4" r="0.8" fill="#fffdf3" />
            </g>
            <path className="cp-call-smile" d="M20.5 30 Q24 33.5 27.5 30" fill="none" stroke="#2a2418" strokeWidth="1.7" strokeLinecap="round" />
            <path className="cp-call-think" d="M20.5 31.5 q1.75 -2 3.5 0 t3.5 0" fill="none" stroke="#2a2418" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="cp-call-mic"><Mic size={8} strokeWidth={3} /></span>
          <span className="cp-call-spark cp-call-spark-1" />
          <span className="cp-call-spark cp-call-spark-2" />
          <span className="cp-nudge-spark cp-nudge-spark-1" />
          <span className="cp-nudge-spark cp-nudge-spark-2" />
          <span className="cp-nudge-spark cp-nudge-spark-3" />
        </span>
      )}
      <span className="cp-call-label">{idle ? 'Talk to me' : status === 'connecting' ? 'Waking up…' : 'End call'}</span>
    </button>
  );
}
