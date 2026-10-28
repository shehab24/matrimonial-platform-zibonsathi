import type { LucideIcon } from 'lucide-react';

/** Header card shown at the top of each dashboard list page */
export function DashboardPageHeader({
  icon: Icon,
  iconClassName,
  title,
  summary,
}: {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  summary?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-6 flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {summary && <p className="text-sm text-gray-500 mt-0.5">{summary}</p>}
      </div>
    </div>
  );
}

export function DashboardEmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    </div>
  );
}

export function DashboardListSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
