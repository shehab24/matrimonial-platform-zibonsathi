/** Placeholder shown instantly on navigation while a page's server data loads */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true">
      <div className="h-20 rounded-xl bg-gray-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
