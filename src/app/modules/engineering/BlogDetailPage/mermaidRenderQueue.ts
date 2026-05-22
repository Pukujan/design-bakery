/** Serialize mermaid.render() so diagram-heavy posts do not thrash the main thread. */
let chain: Promise<unknown> = Promise.resolve();

export function enqueueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
