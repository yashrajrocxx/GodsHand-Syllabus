/* ================================================
   CHAPTER PAGE SCRIPT - LOADS SAVED PREFERENCES
   ================================================ */

document.addEventListener("DOMContentLoaded", function () {
  const htmlEl = document.documentElement;

  // Load and apply saved settings from localStorage
  function loadAndApplySettings() {
    // Load saved preferences
    const fontSize = localStorage.getItem("fontSize") || "normal";
    const theme = localStorage.getItem("theme") || "light";

    // Apply font size
    htmlEl.classList.remove("font-small", "font-normal", "font-large");
    htmlEl.classList.add(`font-${fontSize}`);

    // Apply theme
    if (theme === "dark") {
      htmlEl.classList.add("dark");
    } else {
      htmlEl.classList.remove("dark");
    }
  }

  // Apply settings on page load
  loadAndApplySettings();

  // Theme toggle button functionality
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = htmlEl.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }
});
