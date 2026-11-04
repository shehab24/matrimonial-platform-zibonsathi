import { cn } from '@/lib/utils';

/**
 * Silhouette shown in place of a biodata photo: a capped, bearded man or a woman in niqab.
 * Drawn in currentColor (brand green by default) so it follows the theme.
 */
export function GenderAvatar({ gender, className }: { gender: string | null; className?: string }) {
  const female = gender === 'FEMALE';
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-green-50 text-green-700 ring-1 ring-green-700/40 ring-offset-2 ring-offset-white',
        className
      )}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        {female ? (
          <>
            <path d="M50 17C34 17 25 30 25 46c0 15-5 30-15 54h80C80 76 75 61 75 46c0-16-9-29-25-29Z" fill="currentColor" />
            <rect x="35" y="39" width="30" height="5.5" rx="2.75" fill="#fff" />
          </>
        ) : (
          <>
            <path d="M16 100c2-17 15-27 34-27s32 10 34 27Z" fill="currentColor" />
            <path d="M43 62h14v13H43Z" fill="currentColor" />
            <ellipse cx="50" cy="45" rx="15.5" ry="18.5" fill="#fff" />
            <path d="M34.5 37c0-10.5 7-16 15.5-16s15.5 5.5 15.5 16Z" fill="currentColor" />
            <path d="M34.5 46c0 16 6.5 25 15.5 25s15.5-9 15.5-25c-2 7-5.5 10-9 10.5-2-1.6-4.2-2.2-6.5-2.2s-4.5.6-6.5 2.2c-3.5-.5-7-3.5-9-10.5Z" fill="currentColor" />
          </>
        )}
      </svg>
    </div>
  );
}
