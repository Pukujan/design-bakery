import { useEffect, useRef } from 'react';
import { registerTurnstileSlot } from './turnstile';

/** Where the human check appears in a chat: right above the box the visitor typed in. Empty and hidden unless Turnstile asks. */
export function TurnstileSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? registerTurnstileSlot(ref.current) : undefined), []);
  return (
    <div ref={ref} className="cp-turnstile-slot" role="status">
      <p className="cp-turnstile-note">One quick check that you're human, then I'll answer.</p>
    </div>
  );
}
