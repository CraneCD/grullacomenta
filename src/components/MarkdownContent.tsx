import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// Renders review/blog content written in Markdown.
// - remark-gfm: tables, strikethrough, task lists, autolinks
// - remark-breaks: remaining single newlines (e.g. inside quotes) become <br>
// Raw HTML in the source is NOT rendered (react-markdown escapes it), which
// keeps author content safe from script injection.

const components: Components = {
  a: ({ node: _node, href, children, ...props }) => {
    const isExternal = !!href && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...props}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  },
  table: ({ node: _node, children, ...props }) => (
    <div className="gc-md-table">
      <table {...props}>{children}</table>
    </div>
  ),
  // Plain <img> on purpose: next/image would require whitelisting every host.
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ node: _node, src, alt, ...props }) => <img src={src} alt={alt ?? ''} loading="lazy" {...props} />,
};

// Lines that start a Markdown block (or are blank/indented) must stay glued to
// their neighbours, otherwise lists and tables would be split apart.
const BLOCK_LINE = /^\s*(?:[-*+]\s|\d+[.)]\s|>|#{1,6}\s|\||```|~~~)|^\s{2,}\S|^\s*$/;
const FENCE = /^\s*(?:```|~~~)/;
const TABLE_ROW = /^\s*\|/;
const HEADING = /^\s*#{1,6}\s/;
const BLANK = /^\s*$/;

// Posts were historically written with a single newline between paragraphs.
// Standard Markdown would merge those lines into one paragraph, so insert a
// blank line between two consecutive plain-prose lines (outside code fences).
export function preserveParagraphs(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let inFence = false;
  lines.forEach((line, i) => {
    if (FENCE.test(line)) inFence = !inFence;
    out.push(line);
    const next = lines[i + 1];
    if (inFence || next === undefined || BLANK.test(line)) return;
    const bothProse = !BLOCK_LINE.test(line) && !BLOCK_LINE.test(next);
    // Tables, headings and code fences should start their own block even when
    // typed right under a list or a sentence.
    const startsOwnBlock =
      (TABLE_ROW.test(next) && !TABLE_ROW.test(line)) || HEADING.test(next) || FENCE.test(next);
    if (bothProse || startsOwnBlock) out.push('');
  });
  return out.join('\n');
}

export default function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`gc-prose gc-markdown ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {preserveParagraphs(content)}
      </ReactMarkdown>
    </div>
  );
}
