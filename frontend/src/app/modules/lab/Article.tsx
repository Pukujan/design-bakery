import { Children, isValidElement, useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LabDiagram } from './Diagram';
import { FlowText } from './FlowText';
import { slugify } from './toc';
import { remarkGithubAlerts } from '../research/render/remarkGithubAlerts';
import './article.css';

/** The plain text of a heading, so its anchor matches the contents. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** Inline elements a flowing run may hold. Code is left out: its monospace widths would not match the run's measure. */
const FLOWING_INLINE = new Set(['em', 'strong', 'a', 'del', 'span']);

/** True when the nodes are text and plain inline markup only, so they can flow as one run. */
function flowsInline(nodes: ReactNode[]): boolean {
  return nodes.every(
    (child) =>
      typeof child === 'string' ||
      typeof child === 'number' ||
      (isValidElement(child) && typeof child.type === 'string' && FLOWING_INLINE.has(child.type)),
  );
}

/** A run of nodes, flowed round the bodies when it is plain enough; other markup keeps its own layout. */
function flowed(children: ReactNode): ReactNode {
  const nodes = Children.toArray(children);
  if (!flowsInline(nodes) || textOf(nodes).trim() === '') return children;
  return <FlowText as="span" text={textOf(nodes)}>{nodes}</FlowText>;
}

/** A paragraph split at its line breaks, so each line can sit and flow on its own. Blank lines are dropped. */
function linesOf(children: ReactNode): ReactNode[][] {
  const lines: ReactNode[][] = [[]];
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === 'br') lines.push([]);
    else lines[lines.length - 1].push(child);
  }
  return lines.filter((line) => textOf(line).trim() !== '');
}

/**
 * The markdown components for an article. With `flow` on, its text flows round the bodies in the sky;
 * with it off, the text is set as plain text.
 */
function componentsFor(flow: boolean): Components {
  const run = (children: ReactNode): ReactNode => (flow ? flowed(children) : children);
  return {
    p: ({ children }) => {
      if (!flow) return <p>{children}</p>;
      const lines = linesOf(children);
      if (lines.length > 1) {
        // A paragraph broken by line breaks: each line is its own block, so it sits and flows on its own.
        return (
          <p>
            {lines.map((line, index) => (
              <span key={index} className="article-line">
                {flowed(line)}
              </span>
            ))}
          </p>
        );
      }
      const nodes = Children.toArray(children);
      if (flowsInline(nodes) && textOf(nodes).trim() !== '') {
        return <FlowText text={textOf(nodes)}>{nodes}</FlowText>;
      }
      return <p>{children}</p>;
    },
    h1: ({ children }) => <h2 id={slugify(textOf(children))} className="article-h2">{run(children)}</h2>,
    h2: ({ children }) => <h2 id={slugify(textOf(children))} className="article-h2">{run(children)}</h2>,
    h3: ({ children }) => <h3 id={slugify(textOf(children))} className="article-h3">{run(children)}</h3>,
    h4: ({ children }) => <h4 className="article-h4">{run(children)}</h4>,
    li: ({ children }) => <li>{run(children)}</li>,
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
}

/** Markdown in the lab's type and colours. Text flows round the bodies unless `flow` is off. */
export function Article({ source, flow = true }: { source: string; flow?: boolean }) {
  const components = useMemo(() => componentsFor(flow), [flow]);
  return (
    <div className="article">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkGithubAlerts]} rehypePlugins={[rehypeRaw]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
