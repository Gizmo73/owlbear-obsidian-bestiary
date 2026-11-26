// Match Owlbear's light/dark theme in our pages.

import OBR, { type Theme } from "@owlbear-rodeo/sdk";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.mode === "LIGHT" ? "light" : "dark";
  root.style.setProperty("--obr-text", theme.text.primary);
  root.style.setProperty("--obr-text-2", theme.text.secondary);
  root.style.setProperty("--obr-primary", theme.primary.main);
  root.style.setProperty("--obr-paper", theme.background.paper);
}

export async function followTheme() {
  try {
    apply(await OBR.theme.getTheme());
    OBR.theme.onChange(apply);
  } catch {
    /* keep CSS defaults */
  }
}
