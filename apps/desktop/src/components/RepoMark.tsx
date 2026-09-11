import { repoMark } from '@angkorgit/core';
import { cn } from '@angkorgit/design-system';

export function RepoMark({
  name,
  size = 22,
  faded,
  className,
}: {
  name: string;
  size?: number;
  faded?: boolean;
  className?: string;
}) {
  const { letters, color } = repoMark(name);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-md font-semibold leading-none tracking-tight text-white',
        faded && 'opacity-40',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.42)),
        background: `hsl(var(--graph-${color}))`,
      }}
      data-repo-mark={name}
      aria-hidden
    >
      {letters}
    </span>
  );
}
