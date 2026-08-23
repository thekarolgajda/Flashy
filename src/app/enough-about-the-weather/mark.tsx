/**
 * The game's mark: a rain cloud that is also a speech bubble, with the rain
 * replaced by an exclamation point. Small talk, ended.
 *
 * This is deliberately not the Flashy card-stack. The game is its own object,
 * printed with Flashy rather than part of it.
 */
export function WeatherMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <circle cx="32" cy="32" r="30" fill="var(--mustard)" stroke="var(--edition-ink)" strokeWidth="3" />
      <path
        d="M20 38a8 8 0 0 1 .8-15.9A11 11 0 0 1 42 22.6 7.7 7.7 0 0 1 44 38Z"
        fill="var(--cream)"
        stroke="var(--edition-ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 38l-4 10 11-10Z"
        fill="var(--cream)"
        stroke="var(--edition-ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M36 41v6" stroke="var(--fluo-deep)" strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="36" cy="52" r="2" fill="var(--fluo-deep)" />
    </svg>
  );
}
