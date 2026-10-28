/**
 * Decorative illustrations for the home hero: hanging lanterns, floating hearts, an envelope,
 * a ring, leaves, clouds and a mosque skyline. Pure SVG drawn with currentColor so it follows
 * the theme; hidden from assistive tech and on small screens (except the skyline).
 */

function Lantern({ className, string = 120 }: { className?: string; string?: number }) {
  return (
    <svg viewBox={`0 0 60 ${string + 110}`} className={className} aria-hidden="true">
      <line x1="30" y1="0" x2="30" y2={string} stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="30" cy={string - 8} r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <g transform={`translate(0 ${string})`}>
        <path d="M22 0h16l4 10H18z" fill="currentColor" opacity="0.7" />
        <path d="M14 12h32c2 0 3 1 3 3v52c0 2-1 3-3 3H14c-2 0-3-1-3-3V15c0-2 1-3 3-3z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2" />
        <path d="M20 18v46M30 18v46M40 18v46" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <path d="M14 30c10 8 22 8 32 0M14 52c10-8 22-8 32 0" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <path d="M18 70h24l-4 10H22z" fill="currentColor" opacity="0.7" />
        <circle cx="30" cy="88" r="4" fill="currentColor" opacity="0.7" />
      </g>
    </svg>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" fill="currentColor" />
    </svg>
  );
}

function HeartBalloon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 200" className={className} aria-hidden="true">
      <path d="M40 70s-30-18-36-37C-1 18 8 4 22 4c8 0 14 5 18 11 4-6 10-11 18-11 14 0 23 14 18 29-6 19-36 37-36 37z" fill="currentColor" opacity="0.35" />
      <path d="M40 70c-6 20 10 30 2 50s-14 30-4 78" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

function Envelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
      <rect x="2" y="6" width="60" height="40" rx="4" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9l29 21L61 9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M32 34s-6-3.6-7.6-7.3C23.3 24 25 21 27.8 21c1.7 0 2.9 1 3.6 2.1.7-1.1 1.9-2.1 3.6-2.1 2.8 0 4.5 3 3.3 5.7C36.8 30.4 32 34 32 34z" fill="currentColor" />
    </svg>
  );
}

function Ring({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true">
      <path d="M22 6h20l8 10-18 14L14 16z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 16h36M26 6l6 24 6-24" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="54" r="22" fill="none" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" className={className} aria-hidden="true">
      <path d="M30 118C28 80 32 40 30 4" fill="none" stroke="currentColor" strokeWidth="2" />
      {[20, 42, 64, 86].map((y, i) => (
        <path
          key={y}
          d={i % 2 ? `M30 ${y}c10-2 20-10 24-20-12 0-20 8-24 20z` : `M30 ${y}c-10-2-20-10-24-20 12 0 20 8 24 20z`}
          fill="currentColor"
          opacity="0.5"
        />
      ))}
      <path d="M30 4c-6 6-6 14 0 18 6-4 6-12 0-18z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 50" className={className} aria-hidden="true">
      <path d="M20 46h84c9 0 14-6 14-13s-6-13-14-12C102 9 92 2 80 4 73 -2 58 0 54 10c-8-6-22-2-23 9-10-2-18 5-18 13 0 9 7 14 7 14z" fill="currentColor" />
    </svg>
  );
}

function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M0 120V96h60V70h10V50l6-10 6 10v20h10v26h40V80c0-18 20-30 40-34 20 4 40 16 40 34v16h30V60h6V40l5-12 5 12v20h6v36h50V86c0-26 30-44 60-50 30 6 60 24 60 50v10h40V64h8V46l6-14 6 14v18h8v32h60V82c0-14 16-24 30-28 14 4 30 14 30 28v14h50V70h10V52l6-12 6 12v18h10v26h40V78c0-22 26-36 50-42 24 6 50 20 50 42v18h30V60h6V42l5-12 5 12v18h6v36h50V84c0-16 18-26 34-30 16 4 34 14 34 30v12h60V66h10V48l6-12 6 12v18h10v30h60v24z"
      />
    </svg>
  );
}

export function HeroDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft colour blobs */}
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
      <div className="absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-900/30" />

      <div className="hidden lg:block text-green-700/70 dark:text-green-400/60">
        <Lantern className="absolute left-[6%] top-0 h-64 w-12 hero-sway" string={130} />
        <Lantern className="absolute left-[12%] top-0 h-48 w-10 hero-sway [animation-delay:-2s]" string={80} />
        <Lantern className="absolute right-[7%] top-0 h-72 w-12 hero-sway [animation-delay:-1s]" string={150} />
        <Lantern className="absolute right-[13%] top-0 h-52 w-10 hero-sway [animation-delay:-3s]" string={95} />
      </div>

      <div className="hidden md:block">
        <Cloud className="absolute left-[24%] top-16 h-10 w-24 text-white/90 dark:text-gray-200/60 hero-float" />
        <Cloud className="absolute right-[30%] top-4 h-8 w-20 text-white/80 dark:text-gray-200/50 hero-float [animation-delay:-3s]" />
        <HeartBalloon className="absolute left-[19%] top-44 h-48 w-20 text-green-600/60 dark:text-green-500/40 hero-float [animation-delay:-1.5s]" />
        <HeartBalloon className="absolute right-[19%] top-52 h-44 w-16 text-teal-600/50 dark:text-teal-400/40 hero-float [animation-delay:-4s]" />
        <Envelope className="absolute left-[15%] top-[58%] h-12 w-16 -rotate-12 text-green-700/70 dark:text-green-400/60 hero-float [animation-delay:-2s]" />
        <Ring className="absolute right-[9%] top-[44%] h-14 w-12 rotate-12 text-teal-700/50 dark:text-teal-400/50 hero-float [animation-delay:-5s]" />
        <Sprig className="absolute right-[4%] top-[55%] h-28 w-14 rotate-12 text-green-700/50 dark:text-green-400/40" />
        <Sprig className="absolute left-[3%] top-[62%] h-24 w-12 -rotate-12 text-teal-700/50 dark:text-teal-400/40" />
        <Heart className="absolute left-[30%] top-[66%] h-6 w-6 text-green-600/40 hero-float [animation-delay:-2.5s]" />
        <Heart className="absolute right-[24%] top-[48%] h-4 w-4 text-teal-600/50 hero-float [animation-delay:-1s]" />
      </div>

      <Skyline className="absolute inset-x-0 bottom-0 h-24 w-full text-green-700/10 dark:text-green-400/10" />
    </div>
  );
}
