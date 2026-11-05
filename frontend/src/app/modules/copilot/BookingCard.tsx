import { CalendarCheck, X } from 'lucide-react';
import { copilot, useCopilot } from './store';

/**
 * The booking a voice call has made: who it is for and one button to pick the time. The call's server dialogue (booking.ts) has
 * already checked the name and email with the caller; this puts the result where they are looking, since a call has no chat thread.
 * The button opens the booking page in a new tab, as the chat's "Pick a time" chip does.
 */
export function BookingCard() {
  const { booking } = useCopilot();
  if (!booking) return null;
  return (
    <aside className="cp-book-card" role="dialog" aria-label="Pick a time for your call">
      <button type="button" className="cp-book-close" aria-label="Close" onClick={() => copilot.dismissBooking()}>
        <X size={14} aria-hidden />
      </button>
      <p className="cp-book-kicker">Free 30-minute call{booking.topic ? ` · ${booking.topic}` : ''}</p>
      <p className="cp-book-who">
        {booking.name ? <strong>{booking.name}</strong> : null}
        {booking.name && booking.email ? ' · ' : ''}
        {booking.email ?? ''}
      </p>
      <a className="cp-book-go" href={booking.url} target="_blank" rel="noopener noreferrer" onClick={() => copilot.dismissBooking()}>
        <CalendarCheck size={16} aria-hidden /> Pick a time ↗
      </a>
    </aside>
  );
}
