'use client';

// ── Grulla Comenta · the origami crane (orizuru) ─────────────────────────────
// A faceted paper-crane drawn with currentColor so it recolors cleanly. It is
// the logomark, the rating glyph, and a faint watermark on cover art.

function CranePaths() {
  return (
    <>
      {/* Neck & head */}
      <path d="M4,39 L13,31 L9,42 Z" opacity="0.88" />
      <path d="M13,31 L45,52 L9,42 Z" opacity="0.50" />
      <path d="M9,42 L45,52 L42,58 Z" opacity="0.70" />
      {/* Front wing */}
      <path d="M45,52 L50,3 L58,56 Z" opacity="0.42" />
      <path d="M50,3 L61,27 L58,56 Z" opacity="0.60" />
      {/* Back wing */}
      <path d="M61,27 L80,13 L58,56 Z" opacity="0.50" />
      <path d="M80,13 L86,55 L58,56 Z" opacity="0.36" />
      {/* Body */}
      <path d="M45,52 L58,56 L42,58 Z" opacity="0.58" />
      <path d="M42,58 L58,56 L41,85 Z" opacity="0.64" />
      <path d="M41,85 L58,56 L62,87 Z" opacity="0.82" />
      <path d="M58,56 L86,55 L62,87 Z" opacity="0.56" />
      <path d="M86,55 L89,63 L62,87 Z" opacity="0.66" />
      {/* Tail */}
      <path d="M86,55 L117,36 L89,63 Z" opacity="0.40" />
    </>
  );
}

/**
 * CraneMark — the faceted origami crane (orizuru) drawn with currentColor so it
 * recolors cleanly. It is the rating glyph and a faint watermark on cover art.
 * The crane's natural aspect ratio is 120×90 (4:3); width is derived from height.
 */
export function CraneMark({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="currentColor"
      width={Math.round((size * 120) / 90)}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <CranePaths />
    </svg>
  );
}

/**
 * BrandBadge — the primary brand logomark: the straw-hatted grulla mascot in a
 * round badge. Use `ring` for a hairline ring on busy or dark surfaces.
 */
export function BrandBadge({
  size = 30,
  ring = false,
  className = '',
}: {
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-grulla-badge.png"
      alt="Grulla Comenta"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        display: 'block',
        borderRadius: '50%',
        objectFit: 'cover',
        flex: 'none',
        boxShadow: ring
          ? '0 0 0 2px color-mix(in srgb, var(--paper-50, #fff) 70%, transparent)'
          : undefined,
      }}
    />
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
