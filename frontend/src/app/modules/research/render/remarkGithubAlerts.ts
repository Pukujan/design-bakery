/**
 * GitHub alert syntax for research papers:
 *
 *   > [!IMPORTANT]
 *   > **At a glance**
 *
 * becomes `<aside class="rp-callout rp-callout-important">`. Supported kinds:
 * NOTE, TIP, IMPORTANT, WARNING, CAUTION, KEY, SUMMARY. A blockquote without a
 * marker stays a plain blockquote. Typed loosely so we don't need @types/mdast.
 */
type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

const KINDS = new Set(['note', 'tip', 'important', 'warning', 'caution', 'key', 'summary']);
const MARKER = /^\[!([A-Za-z]+)\][ \t]*\n?/;

function transform(node: MdNode): void {
  if (node.type === 'blockquote') {
    const first = node.children?.[0];
    const text = first?.type === 'paragraph' ? first.children?.[0] : undefined;
    const match = text?.type === 'text' && text.value ? MARKER.exec(text.value) : null;
    const kind = match?.[1].toLowerCase();
    if (match && kind && KINDS.has(kind) && text && first) {
      text.value = text.value!.slice(match[0].length);
      if (!text.value) first.children!.shift();
      // A bare marker line leaves a leading line break node; drop it.
      if (first.children?.[0]?.type === 'break') first.children.shift();
      if (!first.children?.length) node.children!.shift();
      node.data = {
        ...node.data,
        hName: 'aside',
        hProperties: { className: ['rp-callout', `rp-callout-${kind}`], 'data-callout': kind },
      };
    }
  }
  node.children?.forEach(transform);
}

export function remarkGithubAlerts() {
  return (tree: MdNode) => transform(tree);
}
