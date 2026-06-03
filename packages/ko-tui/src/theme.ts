import React, { createContext, useContext, useState, useCallback } from "react";

export interface ThemeColors {
  primary: string;
  secondary: string;
  dimmed: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export type ThemeName = "auto" | "dark" | "light" | "dark-colorblind" | "light-colorblind" | "ansi-dark" | "ansi-light" | "ansi";

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
}

export const darkTheme: Theme = {
  name: "dark",
  colors: {
    primary: "white",
    secondary: "cyan",
    dimmed: "gray",
    error: "red",
    success: "green",
    warning: "yellow",
    info: "blue",
  },
};

export const lightTheme: Theme = {
  name: "light",
  colors: {
    primary: "black",
    secondary: "blue",
    dimmed: "gray",
    error: "red",
    success: "green",
    warning: "yellow",
    info: "blue",
  },
};

export const darkColorblindTheme: Theme = {
  name: "dark-colorblind",
  colors: {
    primary: "white",
    secondary: "blue",
    dimmed: "gray",
    error: "magenta",
    success: "cyan",
    warning: "yellow",
    info: "blue",
  },
};

export const lightColorblindTheme: Theme = {
  name: "light-colorblind",
  colors: {
    primary: "black",
    secondary: "blue",
    dimmed: "gray",
    error: "magenta",
    success: "cyan",
    warning: "yellow",
    info: "blue",
  },
};

export const ansiDarkTheme: Theme = {
  name: "ansi-dark",
  colors: {
    primary: "white",
    secondary: "cyan",
    dimmed: "gray",
    error: "red",
    success: "green",
    warning: "yellow",
    info: "blue",
  },
};

export const ansiLightTheme: Theme = {
  name: "ansi-light",
  colors: {
    primary: "black",
    secondary: "blue",
    dimmed: "gray",
    error: "red",
    success: "green",
    warning: "yellow",
    info: "blue",
  },
};

export const ansiTheme: Theme = { ...ansiDarkTheme, name: "ansi" };
export const autoTheme: Theme = { ...darkTheme, name: "auto" };

const BUILTIN_THEMES: Record<ThemeName, Theme> = {
  auto: autoTheme,
  dark: darkTheme,
  light: lightTheme,
  "dark-colorblind": darkColorblindTheme,
  "light-colorblind": lightColorblindTheme,
  "ansi-dark": ansiDarkTheme,
  "ansi-light": ansiLightTheme,
  ansi: ansiTheme,
};

export function getBuiltinThemes(): Theme[] {
  return Object.values(BUILTIN_THEMES);
}

export function isThemeName(name: string): name is ThemeName {
  return Object.prototype.hasOwnProperty.call(BUILTIN_THEMES, name);
}

export function getTheme(name: string): Theme | undefined {
  return isThemeName(name) ? BUILTIN_THEMES[name] : undefined;
}

// Theme context
interface ThemeContextType {
  theme: Theme;
  setTheme: (name: string) => boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  setTheme: () => false,
});

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children, initialTheme = "dark" }: { children?: React.ReactNode; initialTheme?: string }) {
  const [theme, setThemeState] = useState<Theme>(getTheme(initialTheme) ?? darkTheme);

  const setTheme = useCallback((name: string) => {
    const t = getTheme(name);
    if (!t) return false;
    setThemeState(t);
    return true;
  }, []);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, setTheme } },
    children
  );
}
