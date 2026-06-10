import type { CSSProperties } from "react";

export interface HootTheme {
  id: string;
  name: string;
  primaryColor: string;
  primaryHsl: string;
  primaryForegroundHsl: string;
  gradient: string;
}

export interface CustomTheme {
  primaryColor?: string;
  gradient?: string;
}

export const BUILT_IN_THEMES: HootTheme[] = [
  {
    id: "violet",
    name: "Violet",
    primaryColor: "#7c3aed",
    primaryHsl: "262 83% 58%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
  },
  {
    id: "ocean",
    name: "Ocean",
    primaryColor: "#0ea5e9",
    primaryHsl: "199 89% 48%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #1e3a8a 100%)",
  },
  {
    id: "forest",
    name: "Forest",
    primaryColor: "#16a34a",
    primaryHsl: "142 71% 36%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #16a34a 0%, #059669 50%, #134e4a 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    primaryColor: "#ea580c",
    primaryHsl: "21 90% 48%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #db2777 100%)",
  },
  {
    id: "midnight",
    name: "Midnight",
    primaryColor: "#6366f1",
    primaryHsl: "239 84% 67%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)",
  },
  {
    id: "rose",
    name: "Rose",
    primaryColor: "#e11d48",
    primaryHsl: "347 77% 50%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #9f1239 100%)",
  },
  {
    id: "amber",
    name: "Amber",
    primaryColor: "#d97706",
    primaryHsl: "32 95% 44%",
    primaryForegroundHsl: "20 91% 14%",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)",
  },
  {
    id: "teal",
    name: "Teal",
    primaryColor: "#0d9488",
    primaryHsl: "173 80% 32%",
    primaryForegroundHsl: "210 40% 98%",
    gradient: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #0f766e 100%)",
  },
];

export interface GradientPreset {
  id: string;
  name: string;
  value: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: "purple-haze", name: "Purple Haze", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "sunset-blaze", name: "Sunset Blaze", value: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)" },
  { id: "ocean-breeze", name: "Ocean Breeze", value: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)" },
  { id: "lush-forest", name: "Lush Forest", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "midnight-city", name: "Midnight City", value: "linear-gradient(135deg, #232526 0%, #414345 100%)" },
  { id: "cotton-candy", name: "Cotton Candy", value: "linear-gradient(135deg, #ec38bc 0%, #fdeff9 100%)" },
  { id: "wildfire", name: "Wildfire", value: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)" },
  { id: "aurora", name: "Aurora", value: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" },
  { id: "spring-meadow", name: "Spring Meadow", value: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)" },
  { id: "cosmic-fusion", name: "Cosmic Fusion", value: "linear-gradient(135deg, #ff00cc 0%, #333399 100%)" },
  { id: "mango-tango", name: "Mango Tango", value: "linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)" },
  { id: "deep-sea", name: "Deep Sea", value: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" },
];

export function getThemeById(id: string | null | undefined): HootTheme | undefined {
  if (!id || id === "default") return undefined;
  return BUILT_IN_THEMES.find((t) => t.id === id);
}

export function getDefaultTheme(): HootTheme {
  return BUILT_IN_THEMES[0];
}

export function getGradientById(id: string | null | undefined): GradientPreset | undefined {
  if (!id) return undefined;
  return GRADIENT_PRESETS.find((g) => g.id === id);
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let normalized = hex.trim().replace(/^#/, "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length !== 6) {
    return { h: 0, s: 0, l: 0 };
  }

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hexToHslString(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

export function getContrastingForegroundHsl(hex: string): string {
  let normalized = hex.trim().replace(/^#/, "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length !== 6) return "210 40% 98%";

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "240 10% 3.9%" : "210 40% 98%";
}

export type ThemeCSSProperties = CSSProperties & {
  "--primary"?: string;
  "--primary-foreground"?: string;
  "--ring"?: string;
  "--event-gradient"?: string;
};

export type EventDecorCSSProperties = CSSProperties & {
  "--event-gradient"?: string;
};

export interface ThemeInput {
  themeId?: string | null;
  customTheme?: CustomTheme | null;
}

/** Gradient-only style for banners and cards — does not override site `--primary`. */
export function buildEventDecorStyle({
  themeId,
  customTheme,
}: ThemeInput): EventDecorCSSProperties {
  return {
    "--event-gradient": resolveGradient({ themeId, customTheme }),
  };
}

/** Full participant theme — overrides `--primary` for play screens only. */
export function buildParticipantThemeStyle({
  themeId,
  customTheme,
}: ThemeInput): ThemeCSSProperties {
  const theme = getThemeById(themeId) ?? getDefaultTheme();

  const primaryHsl = customTheme?.primaryColor
    ? hexToHslString(customTheme.primaryColor)
    : theme.primaryHsl;

  const primaryForegroundHsl = customTheme?.primaryColor
    ? getContrastingForegroundHsl(customTheme.primaryColor)
    : theme.primaryForegroundHsl;

  const gradient = customTheme?.gradient ?? theme.gradient;

  return {
    "--primary": `hsl(${primaryHsl})`,
    "--primary-foreground": `hsl(${primaryForegroundHsl})`,
    "--ring": `hsl(${primaryHsl})`,
    "--event-gradient": gradient,
  };
}

/** @deprecated Prefer {@link buildParticipantThemeStyle} or {@link buildEventDecorStyle}. */
export function buildThemeStyle(input: ThemeInput): ThemeCSSProperties {
  return buildParticipantThemeStyle(input);
}

export function resolvePrimaryHex({ themeId, customTheme }: ThemeInput): string {
  if (customTheme?.primaryColor) return customTheme.primaryColor;
  const theme = getThemeById(themeId) ?? getDefaultTheme();
  return theme.primaryColor;
}

export function resolveGradient({ themeId, customTheme }: ThemeInput): string {
  if (customTheme?.gradient) return customTheme.gradient;
  const theme = getThemeById(themeId) ?? getDefaultTheme();
  return theme.gradient;
}
