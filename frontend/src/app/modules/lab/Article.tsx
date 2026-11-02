import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LabDiagram } from './Diagram';
import { slugify } from './toc';
import './article.css';

/** The plain text of a heading, so its anchor matches the contents. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** Markdown in the lab's type and colours: headings, text, links, code, tables and diagrams. */
const components: Components = {
  h1: ({ children }) => <h2 id={slugify(textOf(children))} className="article-h2">{children}</h2>,
  h2: ({ children }) => <h2 id={slugify(textOf(children))} className="article-h2">{children}</h2>,
  h3: ({ children }) => <h3 id={slugify(textOf(children))} className="article-h3">{children}</h3>,
  h4: ({ children }) => <h4 className="article-h4">{children}</h4>,
  a: ({ href, children }) => {
    const external = /^https?:/.test(href ?? '');
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => (
    <figure className="article-figure">
      <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" />
      {alt ? <figcaption>{alt}</figcaption> : null}
    </figure>
  ),
  table: ({ children }) => (
    <div className="article-table">
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }) => {
    const child = Children.toArray(children)[0];
    if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      const language = /language-(\w+)/.exec(child.props.className ?? '')?.[1];
      const text = String(child.props.children ?? '').replace(/\n$/, '');
      if (language === 'mermaid') {
        return (
          <figure className="article-diagram">
            <LabDiagram chart={text} />
          </figure>
        );
      }
      return (
        <pre className="article-code">
          <code>{text}</code>
        </pre>
      );
    }
    return <pre className="article-code">{children}</pre>;
  },
};

export function Article({ source }: { source: string }) {
  return (
    <div className="article">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
