import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "stockwise.theme";

export function ThemeScript() {
  // Inline script to avoid FOUC.
  const code = `(() => { try { const t = localStorage.getItem('${KEY}') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); if (t === 'dark') document.documentElement.classList.add('dark'); } catch(e){} })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function useTheme(): [Theme, (t: Theme) => void, () => void] {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(KEY)) as Theme | null;
    const initial: Theme = stored || (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setThemeState(initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", t === "dark");
    try { localStorage.setItem(KEY, t); } catch {}
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return [theme, setTheme, toggle];
}
