// The game's menu frame: a thin bronze rule whose corners are capped by a chamfered bracket with a jewel.
// Decorative only, and laid over its parent (which must be positioned), so it never changes layout.
// Colours come from the palette through the svg-* classes (tokens.css): SVG presentation attributes cannot read var().

function Corner({ at }: { at: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg className={`frame-corner frame-${at}`} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      {/* The bracket sits on the rule (x/y = 1.5 with the svg 1px outside the box), cutting its corner. */}
      <path d="M1.5 15V5.5L5.5 1.5H15" fill="none" className="svg-line" strokeWidth="1.5" />
      <path d="M4.5 12V7L7 4.5H12" fill="none" className="svg-line-dark" strokeWidth="1" />
      <path d="M7.5 5.2 9.8 7.5 7.5 9.8 5.2 7.5Z" className="svg-fill" />
    </svg>
  )
}

/**
 * `box`: a rule all round with four capped corners (plates, panels, pills).
 * `top`: a rule along the top edge only, fading at its ends, with a jewel at its centre (the bottom sheet).
 */
export function Frame({ edges = 'box' }: { edges?: 'box' | 'top' }) {
  if (edges === 'top') {
    return (
      <span className="frame frame-top" aria-hidden>
        <svg className="frame-jewel" width="36" height="10" viewBox="0 0 36 10">
          <path d="M0 5H12M24 5H36" className="svg-line" strokeWidth="1" />
          <path d="M18 1 22 5 18 9 14 5Z" className="svg-line svg-panel" strokeWidth="1.2" />
          <path d="M18 3.4 19.6 5 18 6.6 16.4 5Z" className="svg-fill" />
        </svg>
      </span>
    )
  }
  return (
    <span className="frame" aria-hidden>
      <Corner at="tl" /><Corner at="tr" /><Corner at="bl" /><Corner at="br" />
    </span>
  )
}

/** A title's ornament: two rules that taper into a jewel, as under the game's menu headings. */
export function Flourish({ className = '' }: { className?: string }) {
  return (
    <svg className={`flourish ${className}`} width="240" height="14" viewBox="0 0 240 14" aria-hidden>
      {/* User-space gradients: a horizontal line has no height, so a bounding-box gradient would not paint. */}
      <defs>
        <linearGradient id="flourish-l" gradientUnits="userSpaceOnUse" x1="8" x2="104" y1="0" y2="0"><stop offset="0" className="svg-stop" stopOpacity="0" /><stop offset="1" className="svg-stop" /></linearGradient>
        <linearGradient id="flourish-r" gradientUnits="userSpaceOnUse" x1="232" x2="136" y1="0" y2="0"><stop offset="0" className="svg-stop" stopOpacity="0" /><stop offset="1" className="svg-stop" /></linearGradient>
      </defs>
      <path d="M8 7H104" stroke="url(#flourish-l)" strokeWidth="1" />
      <path d="M136 7H232" stroke="url(#flourish-r)" strokeWidth="1" />
      <path d="M104 7c4-4 8-4 11 0M136 7c-4 4-8 4-11 0" fill="none" className="svg-line" strokeWidth="1" />
      <path d="M120 2 125 7 120 12 115 7Z" fill="none" className="svg-line" strokeWidth="1.2" />
      <path d="M120 5 122 7 120 9 118 7Z" className="svg-fill" />
    </svg>
  )
}
