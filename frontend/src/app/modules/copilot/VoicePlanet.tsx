import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { flowField } from '../lab/flow';
import { useVoice, voice } from './voice';
import { useCopilot } from './store';
import './voice-planet.css';

const warmups = [
  'Connecting now. Want to ask about my experience?',
  'I’m bringing the call through. Want to book a free consultation too?',
  'While we connect: I build managed AI copilots for websites.',
  'Curious about a project or service? Ask me when I’m through.',
];

/** Floating virtual Pujan presence for an active hands-free call. */
export function VoicePlanet() {
  const call = useVoice();
  const { minimized } = useCopilot();
  const reduceMotion = useReducedMotion();
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [miniOffset, setMiniOffset] = useState(0);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const dragging = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const returnTimer = useRef<number | undefined>(undefined);
  const [portalOrigin, setPortalOrigin] = useState<{ x: number; y: number } | null>(null);
  const active = call.status !== 'idle';

  useEffect(() => { voice.setVisualMeterEnabled(!reduceMotion); }, [reduceMotion]);
  useEffect(() => {
    const visibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  useEffect(() => {
    if (call.status !== 'connecting') { setTyped(''); return; }
    if (pageHidden) return;
    if (reduceMotion) { setTyped(warmups[line]); return; }
    let index = 0;
    let timer = 0;
    let paused = false;
    const tick = () => {
      const message = warmups[line];
      if (index < message.length) {
        index += 1;
        setTyped(message.slice(0, index));
        timer = window.setTimeout(tick, 24);
      } else if (!paused) {
        paused = true;
        timer = window.setTimeout(() => {
          setLine((previous) => (previous + 1) % warmups.length);
          paused = false;
        }, 1500);
      }
    };
    setTyped('');
    timer = window.setTimeout(tick, 120);
    return () => window.clearTimeout(timer);
  }, [call.status, line, pageHidden, reduceMotion]);

  useEffect(() => () => window.clearTimeout(returnTimer.current), []);
  useEffect(() => {
    if (!active) return;
    const mini = document.querySelector('.cp-minimized');
    const update = () => setMiniOffset(mini?.getBoundingClientRect().height ?? 0);
    update();
    const observer = new ResizeObserver(update);
    if (mini) observer.observe(mini);
    window.visualViewport?.addEventListener('resize', update);
    return () => { observer.disconnect(); window.visualViewport?.removeEventListener('resize', update); };
  }, [active, minimized]);
  useEffect(() => {
    if (call.status !== 'connecting') return;
    const hole = flowField.obstacles.find((obstacle) => obstacle.kind === 'disc');
    if (hole?.kind === 'disc') setPortalOrigin({ x: hole.x - (window.innerWidth - 120), y: hole.y - (window.innerHeight - 230) });
  }, [call.status]);

  if (!active) return null;

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.closest('.cp-voice-presence')?.getBoundingClientRect();
    if (!rect) return;
    dragging.current = { pointerX: event.clientX, pointerY: event.clientY, x: rect.left, y: rect.top };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    const rect = event.currentTarget.closest('.cp-voice-presence')?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const height = rect.height;
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - width - 8, dragging.current.x + event.clientX - dragging.current.pointerX)),
      y: Math.max(8, Math.min(window.innerHeight - height - 8, dragging.current.y + event.clientY - dragging.current.pointerY)),
    });
  };
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    dragging.current = null;
    setIsDragging(false);
    window.clearTimeout(returnTimer.current);
    const width = event.currentTarget.closest('.cp-voice-presence')?.getBoundingClientRect().width ?? 230;
    returnTimer.current = window.setTimeout(() => setPosition({ x: Math.max(8, window.innerWidth - width - 18), y: Math.max(8, window.innerHeight - 220) }), 6500);
  };

  const phase = call.status === 'connecting' ? 'Connecting' : call.phase === 'speaking' ? 'Speaking' : 'Listening';
  return (
    <section
      className={`cp-voice-presence${call.status === 'connecting' ? ' is-forming' : ''}${reduceMotion ? ' reduce-motion' : ''}${pageHidden ? ' is-page-hidden' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={{ '--voice-level': call.level, '--voice-minimized-offset': `${miniOffset + 10}px`, ...(portalOrigin ? { '--portal-x': `${portalOrigin.x}px`, '--portal-y': `${portalOrigin.y}px` } : {}), ...(position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : {}) } as React.CSSProperties}
      aria-label={`Pujan virtual call: ${phase}`}
      aria-live="polite"
    >
      <div className="cp-voice-copy">
        <span className="cp-voice-state"><i />{phase}</span>
        {call.status === 'connecting' && <p key={line} className="cp-voice-line">{typed}<span className="cp-voice-caret" /></p>}
      </div>
      <button
        type="button"
        className="cp-voice-planet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Drag virtual Pujan call"
      >
        <span className="cp-voice-orbit cp-voice-orbit--one" />
        <span className="cp-voice-orbit cp-voice-orbit--two" />
        <span className="cp-voice-particles" />
        <span className="cp-voice-core"><span>DB</span></span>
        <span className="cp-voice-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
      </button>
      <div className="cp-voice-controls">
        {call.audioBlocked && <button type="button" data-control className="cp-voice-audio" onClick={() => void voice.enableAudio()} aria-label="Enable call audio"><Volume2 size={16} />Enable audio</button>}
        <button type="button" data-control className={call.muted ? 'is-muted' : ''} onClick={() => voice.toggleMute()} aria-label={call.muted ? 'Unmute microphone' : 'Mute microphone'}>
          {call.muted ? <MicOff size={16} /> : <Mic size={16} />}{call.muted ? 'Unmute' : 'Mute'}
        </button>
        <button type="button" data-control className="cp-voice-end" onClick={() => voice.stop()} aria-label="End call"><PhoneOff size={16} />End call</button>
      </div>
    </section>
  );
}

export default VoicePlanet;
