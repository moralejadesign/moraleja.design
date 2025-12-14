export function ThemeScript() {
  const scriptContent = `(function() {
    const STORAGE_KEY = 'theme-mode';
    const html = document.documentElement;

    let activeMode = 'dark';
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        activeMode = saved;
      }
    } catch (e) {}

    if (activeMode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
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

