import Image from 'next/image';

// public/logo.png is 1011×244 (transparent); logo-dark.png is the same with white text for dark backgrounds
const WIDTH = 1011;
const HEIGHT = 244;

/**
 * Brand logo. `tone="auto"` swaps to the light-text version in dark mode;
 * `tone="onDark"` always uses it (e.g. the footer, which is dark in both themes).
 */
export function Logo({
  alt,
  className = 'h-10 w-auto',
  tone = 'auto',
  priority = false,
}: {
  alt: string;
  className?: string;
  tone?: 'auto' | 'onDark';
  priority?: boolean;
}) {
  if (tone === 'onDark') {
    return <Image src="/logo-dark.png" alt={alt} width={WIDTH} height={HEIGHT} className={className} priority={priority} />;
  }
  return (
    <>
      <Image src="/logo.png" alt={alt} width={WIDTH} height={HEIGHT} className={`${className} dark:hidden`} priority={priority} />
      <Image src="/logo-dark.png" alt="" aria-hidden="true" width={WIDTH} height={HEIGHT} className={`${className} hidden dark:block`} priority={priority} />
    </>
  );
}
