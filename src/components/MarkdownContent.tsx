import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// Renders review/blog content written in Markdown.
// - remark-gfm: tables, strikethrough, task lists, autolinks
// - remark-breaks: single newlines become <br>, so older posts that used one
//   line per paragraph keep their line structure
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

export default function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`gc-prose gc-markdown ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
