/**
 * Flashy's mark: two cards caught mid-shuffle. The cards spread apart on
 * hover, which is the one place the logo gets to move.
 *
 * The same artwork is served as a favicon from `public/icon.svg`; keep the two
 * in step if the shapes change.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={`logo-mark ${className}`}
    >
      <rect width="64" height="64" rx="15" fill="var(--lime-deep)" />
      <g transform="translate(32 32)">
        <rect
          className="logo-card-back"
          x="-18"
          y="-13"
          width="36"
          height="26"
          rx="4"
          fill="var(--paper-warm)"
        />
        <g className="logo-card-front">
          <rect
            x="-18"
            y="-13"
            width="36"
            height="26"
            rx="4"
            fill="var(--paper)"
            stroke="var(--lime-deep)"
            strokeWidth="2.5"
          />
          <line
            x1="-8.5"
            y1="0"
            x2="8.5"
            y2="0"
            stroke="var(--lime-deep)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}

/** Mark plus wordmark, as used in the page header. */
export function Logo() {
  return (
    <span className="logo group inline-flex items-center gap-3.5 sm:gap-4">
      <LogoMark className="size-[clamp(2.75rem,6vw,3.75rem)] shrink-0" />
      <span className="font-display text-[clamp(2.75rem,7vw,4.25rem)] leading-none font-bold tracking-[-0.025em]">
        Flashy
      </span>
    </span>
  );
}
