export function formatRelativeTime(iso: string, now?: Date): string {
  const then = new Date(iso);
  const ref = now ?? new Date();
  const diffMs = ref.getTime() - then.getTime();
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return "just now";
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return then.toISOString().slice(0, 10);
}
