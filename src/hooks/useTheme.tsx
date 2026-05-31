import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeColors {
  primary: string;
  "primary-foreground": string;
  navy: string;
  "navy-foreground": string;
  background: string;
  foreground: string;
  accent: string;
  secondary: string;
}

export interface ThemeSettings {
  colors: Partial<ThemeColors>;
  font: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  colors: {
    primary: "#e0512f",
    "primary-foreground": "#ffffff",
    navy: "#173f3e",
    "navy-foreground": "#f4faf9",
    background: "#f8fbfa",
    foreground: "#23393a",
    accent: "#f6e2d2",
    secondary: "#eef2f1",
  },
  font: "Cairo",
};

export const COLOR_FIELDS: { key: keyof ThemeColors; ar: string; en: string }[] = [
  { key: "primary", ar: "اللون الأساسي", en: "Primary" },
  { key: "primary-foreground", ar: "نص اللون الأساسي", en: "Primary text" },
  { key: "navy", ar: "لون الترويسة", en: "Header" },
  { key: "navy-foreground", ar: "نص الترويسة", en: "Header text" },
  { key: "background", ar: "الخلفية", en: "Background" },
  { key: "foreground", ar: "لون النص", en: "Text" },
  { key: "accent", ar: "اللون المميز", en: "Accent" },
  { key: "secondary", ar: "اللون الثانوي", en: "Secondary" },
];

export const FONT_OPTIONS = [
  "Cairo",
  "Tajawal",
  "Almarai",
  "Noto Kufi Arabic",
  "IBM Plex Sans Arabic",
  "Changa",
] as const;

const FONT_URLS: Record<string, string> = {
  Cairo: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap",
  Tajawal: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap",
  Almarai: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap",
  "Noto Kufi Arabic":
    "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;700;800&display=swap",
  "IBM Plex Sans Arabic":
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
  Changa: "https://fonts.googleapis.com/css2?family=Changa:wght@400;500;600;700;800&display=swap",
};

function ensureFont(font: string) {
  if (typeof document === "undefined") return;
  const url = FONT_URLS[font];
  if (!url) return;
  const id = `dyn-font-${font.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

export function applyTheme(theme: Partial<ThemeSettings>) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([k, v]) => {
      if (v) root.style.setProperty(`--${k}`, v);
    });
  }
  if (theme.font) {
    ensureFont(theme.font);
    const stack = `"${theme.font}", system-ui, sans-serif`;
    root.style.setProperty("--font-sans", stack);
    root.style.setProperty("--font-display", stack);
    document.body.style.fontFamily = stack;
  }
}

interface ThemeContextValue {
  theme: ThemeSettings;
  loading: boolean;
  save: (next: ThemeSettings) => Promise<void>;
  preview: (next: ThemeSettings) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "theme")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as ThemeSettings;
          const merged: ThemeSettings = {
            colors: { ...DEFAULT_THEME.colors, ...v.colors },
            font: v.font || DEFAULT_THEME.font,
          };
          setTheme(merged);
          applyTheme(merged);
        }
        setLoading(false);
      });
  }, []);

  const preview = (next: ThemeSettings) => {
    setTheme(next);
    applyTheme(next);
  };

  const save = async (next: ThemeSettings) => {
    preview(next);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "theme", value: JSON.parse(JSON.stringify(next)) }, { onConflict: "key" });
    if (error) throw error;
  };

  return (
    <ThemeContext.Provider value={{ theme, loading, save, preview }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
