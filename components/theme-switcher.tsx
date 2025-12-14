"use client";

import { useThemeContext } from "@/providers/theme";

const SunIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="currentColor"
    className="size-4"
  >
    <path d="M9 0.5C9.41421 0.5 9.75 0.835786 9.75 1.25V2.25C9.75 2.66421 9.41421 3 9 3C8.58579 3 8.25 2.66421 8.25 2.25V1.25C8.25 0.835786 8.58579 0.5 9 0.5Z" />
    <path d="M9 15C9.41421 15 9.75 15.3358 9.75 15.75V16.75C9.75 17.1642 9.41421 17.5 9 17.5C8.58579 17.5 8.25 17.1642 8.25 16.75V15.75C8.25 15.3358 8.58579 15 9 15Z" />
    <path d="M15 9C15 8.58579 15.3358 8.25 15.75 8.25H16.75C17.1642 8.25 17.5 8.58579 17.5 9C17.5 9.41421 17.1642 9.75 16.75 9.75H15.75C15.3358 9.75 15 9.41421 15 9Z" />
    <path d="M0.5 9C0.5 8.58579 0.835786 8.25 1.25 8.25H2.25C2.66421 8.25 3 8.58579 3 9C3 9.41421 2.66421 9.75 2.25 9.75H1.25C0.835786 9.75 0.5 9.41421 0.5 9Z" />
    <path d="M9 13.25C11.3472 13.25 13.25 11.347 13.25 9C13.25 6.653 11.3472 4.75 9 4.75C6.6528 4.75 4.75 6.653 4.75 9C4.75 11.347 6.6528 13.25 9 13.25Z" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="currentColor"
    className="size-4"
  >
    <path d="M8.54419 1.47446C8.70875 1.73227 8.70028 2.06417 8.52278 2.31324C7.88003 3.21522 7.5 4.31129 7.5 5.49999C7.5 8.53778 9.96222 11 13 11C14.0509 11 15.029 10.7009 15.8667 10.1868C16.1275 10.0267 16.4594 10.0412 16.7053 10.2233C16.9513 10.4054 17.0619 10.7186 16.9848 11.0148C16.0904 14.4535 12.9735 17 9.25 17C4.83179 17 1.25 13.4182 1.25 8.99999C1.25 5.08453 4.06262 1.83365 7.77437 1.14073C8.07502 1.0846 8.37963 1.21666 8.54419 1.47446Z" />
  </svg>
);

export function ThemeSwitcher() {
  const { mounted, isDark, toggleMode } = useThemeContext();

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary"
        disabled
        aria-label="Toggle theme"
      >
        <div className="size-4" />
      </button>
    );
  }

  const handleClick = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const coords = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    toggleMode(coords);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

