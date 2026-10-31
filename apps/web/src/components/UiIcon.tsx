export type UiIconName =
  | "eye"
  | "eye-off"
  | "device"
  | "search"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "copy"
  | "check"
  | "close"
  | "plus"
  | "minus"
  | "download"
  | "shield"
  | "wallet"
  | "history"
  | "menu"
  | "refresh"
  | "external"
  | "arrow-in"
  | "arrow-out";
const paths: Record<UiIconName, string> = {
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  "eye-off":
    "m3 3 18 18M10 5c8-1 12 7 12 7a20 20 0 0 1-4 5M6 6a20 20 0 0 0-4 6s4 7 10 7a14 14 0 0 0 4-1M10 10a3 3 0 0 0 4 4",
  device: "M3 4h18v13H3zM8 21h8M12 17v4",
  search: "m21 21-5-5M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-up": "m6 15 6-6 6 6",
  "chevron-left": "m15 6-6 6 6 6",
  "chevron-right": "m9 6 6 6-6 6",
  copy: "M9 9h12v12H9zM15 5V3H3v12h2",
  check: "m4 12 5 5L20 6",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 4v16M4 12h16",
  minus: "M4 12h16",
  download: "M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z",
  wallet: "M3 5h17v16H3zM3 5V3h14v2M15 11h6v5h-6z",
  history: "M3 11a9 9 0 1 1 2 7M3 3v8h8M12 7v6l4 2",
  menu: "M3 6h18M3 12h18M3 18h18",
  refresh:
    "M21 11a9 9 0 0 0-16-6L2 8M2 2v6h6M3 13a9 9 0 0 0 16 6l3-3M22 22v-6h-6",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  "arrow-in": "M12 2v13m-5-5 5 5 5-5M4 12v9h16v-9",
  "arrow-out": "M12 15V2m-5 5 5-5 5 5M4 12v9h16v-9",
};
export default function UiIcon({
  name,
  size = 16,
}: {
  name: UiIconName;
  size?: number;
}) {
  return (
    <svg
      className={"ui-icon ui-" + name}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
