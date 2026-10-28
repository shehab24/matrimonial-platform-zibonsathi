export function ContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <section className="bg-gradient-to-br from-green-700 via-green-800 to-teal-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
          {subtitle && <p className="mt-3 text-white/85 text-lg">{subtitle}</p>}
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-10 space-y-6 text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

// Shared contact address shown on public pages
export const CONTACT_EMAIL = 'support@zibonsathi.com';
