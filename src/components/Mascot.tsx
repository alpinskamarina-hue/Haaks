// The Haaks helper: a smiling builder in an orange hard hat, waving. Drawn inline so it needs no file.
export function Mascot({ size = 72, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#ffedd5" />
      {/* Waving arm */}
      <path d="M86 98 L100 74" stroke="#2563eb" strokeWidth="11" strokeLinecap="round" />
      <circle cx="102" cy="68" r="8" fill="#f2c094" />
      <path d="M97 63 l-2 -6 M102 60 l0 -7 M107 62 l3 -6" stroke="#f2c094" strokeWidth="3.5" strokeLinecap="round" />
      {/* Body: orange shirt and blue overalls */}
      <path d="M26 120 Q26 92 60 90 Q94 92 94 120 Z" fill="#f97316" />
      <path d="M40 120 L40 100 L80 100 L80 120 Z" fill="#2563eb" />
      <path d="M44 100 L40 92 M76 100 L80 92" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <circle cx="46" cy="104" r="2" fill="#fde68a" />
      <circle cx="74" cy="104" r="2" fill="#fde68a" />
      <rect x="54" y="104" width="12" height="8" rx="2" fill="#1d4ed8" />
      {/* Neck and head */}
      <rect x="53" y="80" width="14" height="12" rx="4" fill="#e8b083" />
      <circle cx="34" cy="62" r="5" fill="#e8b083" />
      <circle cx="86" cy="62" r="5" fill="#e8b083" />
      <circle cx="60" cy="60" r="26" fill="#f2c094" />
      {/* Hard hat */}
      <path d="M32 50 Q32 24 60 24 Q88 24 88 50 Z" fill="#fbbf24" />
      <rect x="57" y="25" width="6" height="25" rx="3" fill="#f59e0b" />
      <rect x="27" y="46" width="66" height="8" rx="4" fill="#ea580c" />
      {/* Face */}
      <path d="M45 59 q5 -4 10 0 M65 59 q5 -4 10 0" stroke="#7c4a2d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="64" r="3.2" fill="#1f2937" />
      <circle cx="70" cy="64" r="3.2" fill="#1f2937" />
      <circle cx="51" cy="63" r="1" fill="#fff" />
      <circle cx="71" cy="63" r="1" fill="#fff" />
      <circle cx="43" cy="72" r="4" fill="#fb923c" opacity="0.45" />
      <circle cx="77" cy="72" r="4" fill="#fb923c" opacity="0.45" />
      <path d="M48 73 Q60 85 72 73 Q60 79 48 73 Z" fill="#9a3412" />
      <path d="M52 75 Q60 79 68 75" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
