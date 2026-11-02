import { useEffect, useId, useRef, useState } from 'react';

type MermaidApi = (typeof import('mermaid'))['default'];

let mermaidReady: Promise<MermaidApi> | null = null;

/** Loads mermaid once, in the lab's palette, so every diagram matches the page. */
function loadMermaid(): Promise<MermaidApi> {
  mermaidReady ??= import('mermaid').then((module) => {
    module.default.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: "'Bricolage Grotesque Variable', system-ui, sans-serif",
      themeVariables: {
        background: '#11110f',
        primaryColor: '#1a1a18',
        primaryTextColor: '#f2efe8',
        primaryBorderColor: '#c6f432',
        lineColor: '#8f8b82',
        secondaryColor: '#1a1a18',
        tertiaryColor: '#11110f',
        textColor: '#f2efe8',
        edgeLabelBackground: '#11110f',
        clusterBkg: '#151513',
        clusterBorder: '#2a2925',
        noteBkgColor: '#1a1a18',
        noteTextColor: '#f2efe8',
        noteBorderColor: '#2a2925',
      },
    });
    return module.default;
  });
  return mermaidReady;
}

/** A diagram drawn as an SVG in the lab's palette, with no viewer controls. Shows the source if it cannot be drawn. */
export function LabDiagram({ chart }: { chart: string }) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then((mermaid) => mermaid.render(`lab${reactId}`, chart))
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (failed) {
    return (
      <pre className="article-code">
        <code>{chart}</code>
      </pre>
    );
  }
  return <div ref={ref} className="lab-diagram" />;
}
