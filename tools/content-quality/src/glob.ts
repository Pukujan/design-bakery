/**
 * Minimal glob support (`**`, `*`, `?`, `{a,b}`, `[abc]`) so the package has no
 * runtime dependencies. Paths are always repo-relative with forward slashes.
 */

function escapeChar(char: string): string {
  return /[.+^$()|\\]/.test(char) ? `\\${char}` : char;
}

export function globToRegExp(glob: string): RegExp {
  let out = '';
  let index = 0;
  while (index < glob.length) {
    const char = glob[index] ?? '';
    if (char === '*') {
      const isDouble = glob[index + 1] === '*';
      if (isDouble) {
        const followedBySlash = glob[index + 2] === '/';
        out += followedBySlash ? '(?:.*/)?' : '.*';
        index += followedBySlash ? 3 : 2;
        continue;
      }
      out += '[^/]*';
      index += 1;
      continue;
    }
    if (char === '?') {
      out += '[^/]';
      index += 1;
      continue;
    }
    if (char === '{') {
      const end = glob.indexOf('}', index);
      if (end > index) {
        const options = glob.slice(index + 1, end).split(',').map((option) => option.trim());
        out += `(?:${options.map((option) => globToRegExp(option).source.replace(/^\^|\$$/g, '')).join('|')})`;
        index = end + 1;
        continue;
      }
    }
    if (char === '[') {
      const end = glob.indexOf(']', index);
      if (end > index) {
        out += glob.slice(index, end + 1);
        index = end + 1;
        continue;
      }
    }
    out += escapeChar(char);
    index += 1;
  }
  return new RegExp(`^${out}$`);
}

export function matchGlob(glob: string, path: string): boolean {
  return globToRegExp(glob).test(path.replace(/\\/g, '/'));
}

export function matchAny(globs: string[], path: string): boolean {
  return globs.some((glob) => matchGlob(glob, path));
}
