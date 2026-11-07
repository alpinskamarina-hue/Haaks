// The Haaks helper: a friendly builder in an orange hard hat, waving (public/mascot.webp).
export function Mascot({ size = 72, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mascot.webp"
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ring-2 ring-orange-300 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
