export function ThemeScript() {
  const scriptContent = `(function() {
    const STORAGE_KEY = 'theme-mode';
    const html = document.documentElement;

    let activeMode = 'light';
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        activeMode = saved;
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeMode = isDark ? 'dark' : 'light';
      }
    } catch (e) {}

    if (activeMode === 'dark') {
      html.classList.add('dark');
    }
    
    html.style.colorScheme = activeMode;
  })();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  );
}

