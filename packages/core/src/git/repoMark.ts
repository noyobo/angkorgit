export function repoMark(name: string): { letters: string; color: number } {
  const parts = name.trim().split(/[-_]+/).filter(Boolean);
  let letters = '?';
  if (parts.length === 1) {
    const chars = [...parts[0]].slice(0, 2).map((c) => c.toUpperCase());
    if (chars.length > 0) letters = chars.join('');
  } else if (parts.length >= 2) {
    const a = [...parts[0]][0];
    const b = [...parts[1]][0];
    if (a && b) letters = (a + b).toUpperCase();
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  hash ^= hash >>> 16;
  return { letters, color: Math.abs(hash) % 10 };
}
