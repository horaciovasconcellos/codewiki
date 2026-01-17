// js/mermaid-theme.js
document.addEventListener("DOMContentLoaded", () => {
  const setMermaidTheme = () => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    mermaid.initialize({ startOnLoad: true, theme: isDark ? "dark" : "default" });
  };

  setMermaidTheme();
});
