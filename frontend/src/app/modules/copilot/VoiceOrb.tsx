import { PhoneOff } from 'lucide-react';
import { useVoice, voice } from './voice';
import './voice-orb.css';

const LABEL = {
  connecting: 'Connecting',
  listening: 'Listening',
  speaking: 'Speaking',
} as const;

/**
 * The voice call as a glowing orb docked to the bottom edge. Rings pulse while the call
 * connects, quicken while you talk, and swell when the agent speaks. It is shown only
 * during a call, and End call sits on it, so the call can be stopped without the chat.
 */
export default function VoiceOrb() {
  const { status, speaking, error } = useVoice();
  if (status === 'idle') return null;

  const mode = status === 'connecting' ? 'connecting' : speaking === 'agent' ? 'speaking' : 'listening';

  return (
    <div className={`vo vo-${mode}`} role="status" aria-live="polite">
      <div className="vo-orb" aria-hidden="true">
        <span className="vo-ring vo-ring-1" />
        <span className="vo-ring vo-ring-2" />
        <span className="vo-ring vo-ring-3" />
        <span className="vo-core" />
      </div>
      <div className="vo-meta">
        <span className="vo-label">{LABEL[mode]}</span>
        {error && <span className="vo-error">{error}</span>}
      </div>
      <button type="button" className="vo-end" onClick={() => voice.stop()} aria-label="End call">
        <PhoneOff size={16} />
      </button>
    </div>
  );
}
