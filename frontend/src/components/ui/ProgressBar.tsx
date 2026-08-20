export function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div className="h-full rounded-full bg-green-500 transition-all dark:bg-green-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
