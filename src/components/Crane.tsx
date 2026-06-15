'use client';

// ── Grulla Comenta · the origami crane (orizuru) ─────────────────────────────
// A faceted paper-crane drawn with currentColor so it recolors cleanly. It is
// the logomark, the rating glyph, and a faint watermark on cover art.

function CranePaths() {
  return (
    <>
      <path d="M41 39 L31 5 L60 19 Z" opacity="0.55" />
      <path d="M41 39 L31 5 L40 24 Z" opacity="0.8" />
      <path d="M41 39 L78 23 L62 41 Z" opacity="0.62" />
      <path d="M41 39 L7 28 L23 42 Z" opacity="0.9" />
      <path d="M9 28 L1 33 L13 33 Z" />
      <path d="M41 39 L23 42 L38 63 Z" />
      <path d="M41 39 L38 63 L53 55 Z" opacity="0.72" />
    </>
  );
}

export function CraneMark({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <CranePaths />
    </svg>
  );
}

/**
 * Crane rating — the brand's review metric. Ratings are measured in **grullas**
 * (cranes), not stars. Reviews are scored out of 10; we render 5 cranes filled
 * proportionally and show the numeric score alongside.
 */
export function CraneRating({
  rating,
  outOf = 10,
  size = 18,
  showValue = true,
  className = '',
}: {
  rating: number;
  outOf?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const cranes = 5;
  const filled = Math.round((rating / outOf) * cranes);
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-ui ${className}`}
      role="img"
      aria-label={`${rating} de ${outOf} grullas`}
    >
      <span className="inline-flex gap-0.5">
        {Array.from({ length: cranes }, (_, i) => (
          <CraneMark
            key={i}
            size={size}
            className={i < filled ? 'text-persimmon-500' : 'text-ink-300'}
          />
        ))}
      </span>
      {showValue && (
        <span className="font-bold text-sm text-ink-700">
          {rating}
          <span className="text-ink-400">/{outOf}</span>
        </span>
      )}
    </span>
  );
}

export default CraneMark;
