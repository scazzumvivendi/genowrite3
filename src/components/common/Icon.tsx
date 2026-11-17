const paths = {
  numbered: 'M3 4h1v5M3 9h2M3 13c3-2 3 1 1 2l-1 2h3M9 6h12M9 12h12M9 18h12',
  menu: 'M4 6h16M4 12h16M4 18h16',
  inspector: 'M14 4v16M4 4h16v16H4zM17 8h1M17 12h1',
  zen: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
  close: 'm6 6 12 12M6 18 18 6',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  export: 'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',
  book: 'M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15',
  chapter: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
  scene: 'M5 5h14v14H5zM9 9h6M9 13h4',
  people:
    'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20v-3c0-4 12-4 12 0v3M16 5a3 3 0 0 1 0 6M17 14c3 0 5 1 5 3v3',
  pin: 'M12 22s7-8 7-13a7 7 0 1 0-14 0c0 5 7 13 7 13ZM12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  object: 'm12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10 9-5m-9 5L3 8m9 5v9',
  note: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  undo: 'M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12',
  redo: 'm16 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1',
} as const;

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
