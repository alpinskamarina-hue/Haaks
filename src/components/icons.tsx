// Small line icons (24px grid, stroke follows text colour).
const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.35-4.35",
  quote: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 0v5h5M9 13h6M9 17h4",
  orders: "M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm5 0V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 13h16",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2zm3 5h6M9 12h6M9 16h3",
  passport: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm5 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-3 7c.5-1.5 1.7-2 3-2s2.5.5 3 2m3-6h3m-3 3h3",
  camera: "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm8 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}
