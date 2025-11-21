document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG - Multiple AI Providers ---
  const AI_PROVIDERS = {
    gemini: {
      name: "Google Gemini",
      apiKey: "AIzaSyDrsy9iaa06TOkCisLGV6atzBAhHjrF5ZY",
      endpoint:
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    },
    // Groq - Free tier with 30 requests/min
    groq: {
      name: "Groq",
      apiKey: "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",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.1-8b-instant",
    },
    // Ollama local (if user has it installed)
    ollama: {
      name: "Ollama (Local)",
      endpoint: "http://localhost:11434/api/generate",
      model: "llama3.2",
    },
  };

  let currentProvider = "gemini";
  let isApiCallPending = false;

  // --- ELEMENTS ---
  const htmlEl = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const selectionPopup = document.getElementById("selection-popup");
  const popupExplain = document.getElementById("popup-content-explain");
  const popupChat = document.getElementById("popup-chat");
  const popupClose = document.getElementById("popup-close");
  const mainContent = document.getElementById("main-content");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatMessages = document.getElementById("chat-messages");
  const popupTabs = document.querySelectorAll(".popup-tab");

  let selectedText = "";
  let chatHistory = [];

  // --- THEME TOGGLE ---
  function setTheme(isDark) {
    if (isDark) {
      htmlEl.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      htmlEl.classList.remove("dark");
      localStorage.theme = "light";
    }
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = htmlEl.classList.contains("dark");
    setTheme(!isDark);
  });

  // --- SELECTION LOGIC (Mobile & Desktop) ---
  const handleSelection = (e) => {
    // 1. Allow interaction inside the popup without closing it
    if (selectionPopup.contains(e.target)) return;

    // 2. Ignore clicks on specific UI elements (like the theme toggle)
    if (e.target.closest("#theme-toggle")) return;

    // 3. Wait a tick for the browser to update the selection range
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      // Check if text is selected AND it's inside the main content area
      if (
        text.length > 0 &&
        mainContent &&
        mainContent.contains(selection.anchorNode)
      ) {
        selectedText = text;

        // Reset Chat
        chatHistory = [];
        if (chatMessages) chatMessages.innerHTML = "";

        // Get Coordinates
        // We use the range rect to get the visual position of the selection
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Show the popup
          showPopup(rect);

          // Auto-load explanation
          switchTab("explain");
        } catch (err) {
          console.warn("Could not get selection bounds", err);
        }
      } else {
        // If no text is selected (or clicked outside), hide popup
        selectionPopup.classList.remove("visible");
      }
    }, 10);
  };

  // Attach to both Mouse and Touch events
  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("touchend", handleSelection);

  // --- DISABLE CONTEXT MENU ---
  // This prevents the native "Copy/Paste" menu from blocking our popup
  document.addEventListener("contextmenu", (e) => {
    if (
      window.getSelection().toString().trim().length > 0 &&
      mainContent &&
      mainContent.contains(e.target)
    ) {
      e.preventDefault();
    }
  });

  // --- POPUP FUNCTIONS ---
  if (popupClose) {
    popupClose.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering selection logic
      selectionPopup.classList.remove("visible");
    });
  }

  function showPopup(rect) {
    // Responsive sizing
    const isMobile = window.innerWidth < 640;
    const popupWidth = isMobile ? Math.min(window.innerWidth - 20, 380) : 420;
    const popupHeight = 400; // Max height estimate
    const margin = isMobile ? 10 : 15;

    // --- Horizontal Positioning ---
    // Center the popup horizontally relative to the selection
    let left = rect.left + rect.width / 2 - popupWidth / 2;

    // Clamp: Ensure it doesn't go off the left screen edge
    if (left < margin) {
      left = margin;
    }
    // Clamp: Ensure it doesn't go off the right screen edge
    else if (left + popupWidth > window.innerWidth - margin) {
      left = window.innerWidth - popupWidth - margin;
    }

    // Add horizontal scroll offset (usually 0 for mobile, but important for desktop)
    const absoluteLeft = left + window.scrollX;

    // --- Vertical Positioning ---
    // Default: Calculate position *above* the text
    let top = rect.top + window.scrollY - popupHeight - margin;

    // Check collision with top of viewport
    // On mobile, prefer showing below to avoid keyboard issues
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (isMobile && spaceBelow > 200) {
      // On mobile with space below, show below
      top = rect.bottom + window.scrollY + margin;
    } else if (spaceAbove < popupHeight + margin) {
      // Not enough space above, show below
      top = rect.bottom + window.scrollY + margin;
    }

    // Apply coordinates
    selectionPopup.style.left = `${absoluteLeft}px`;
    selectionPopup.style.top = `${top}px`;
    selectionPopup.style.width = `${popupWidth}px`;
    selectionPopup.classList.add("visible");
  }

  // --- TAB LOGIC ---
  if (popupTabs) {
    popupTabs.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
        switchTab(e.target.dataset.tab);
      });
    });
  }

  function switchTab(mode) {
    popupTabs.forEach((b) => b.classList.remove("active"));
    document.querySelector(`[data-tab="${mode}"]`).classList.add("active");

    if (mode === "discuss") {
      popupExplain.style.display = "none";
      popupChat.classList.remove("hidden");
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      renderChat();
    } else {
      popupChat.classList.add("hidden");
      popupExplain.style.display = "block";

      // Show professional loading state
      popupExplain.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 150px; gap: 1rem;">
          <div class="spinner"></div>
          <p style="color: #64748b; font-size: 0.875rem; font-weight: 500;">Loading explanation...</p>
        </div>
      `;

      const prompt = `
            You are a helpful dictionary assistant.
            Term: "${selectedText}"
            
            Instructions:
            1. Define the term simply in English (Max 2 sentences).
            2. Translate JUST the term "${selectedText}" into Hindi.
            
            Output Format (Markdown):
            **Definition:** [English Definition]
            
            **Hindi:** [Hindi Translation]
            `;

      callAI(prompt).then((res) => {
        popupExplain.innerHTML = marked.parse(res);
      });
    }
  }

  // --- MULTI-PROVIDER AI LOGIC ---
  async function callAI(prompt, retries = 2) {
    if (isApiCallPending)
      return "Please wait for the current request to complete.";
    isApiCallPending = true;

    // Try providers in order: gemini -> groq -> ollama -> offline
    const providers = ["gemini", "groq", "ollama"];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        console.log(`Trying ${AI_PROVIDERS[provider].name}...`);
        const result = await callProvider(provider, prompt);
        currentProvider = provider;
        return result;
      } catch (e) {
        console.warn(`${AI_PROVIDERS[provider].name} failed:`, e.message);

        // If rate limited on gemini, try next provider immediately
        if (e.message.includes("429") || e.message.includes("quota")) {
          continue;
        }

        // If last provider, fall back to offline mode
        if (i === providers.length - 1) {
          return fallbackOfflineResponse(prompt);
        }
      }
    }

    isApiCallPending = false;
    return fallbackOfflineResponse(prompt);
  }

  async function callProvider(provider, prompt) {
    const config = AI_PROVIDERS[provider];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let response;

      if (provider === "gemini") {
        response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `${response.status}: ${
              errorData.error?.message || response.statusText
            }`
          );
        }

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Invalid response format");
      } else if (provider === "groq") {
        response = await fetch(config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
        throw new Error("Invalid response format");
      } else if (provider === "ollama") {
        // Try local Ollama installation
        response = await fetch(config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.model,
            prompt: prompt,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Ollama not available");
        }

        const data = await response.json();
        if (data.response) {
          return data.response;
        }
        throw new Error("Invalid response format");
      }
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    } finally {
      isApiCallPending = false;
    }
  }

  function fallbackOfflineResponse(prompt) {
    // Simple offline dictionary mode
    const text = selectedText.toLowerCase().trim();

    // Check if it's a simple term request
    if (prompt.includes("Define the term") || prompt.includes("dictionary")) {
      return `**Offline Mode**\n\n**Selected Text:** ${selectedText}\n\n*AI services are temporarily unavailable. This is a basic offline response.*\n\n**Tip:** The selected text appears to be "${
        text.split(" ")[0]
      }". You can:\n1. Try again in a few moments\n2. Search online for more information\n3. Check a dictionary or reference material`;
    }

    // For chat/discussion mode
    return `**Offline Mode**\n\nAI services are currently unavailable. Please:\n\n1. **Check your internet connection**\n2. **Wait a moment** and try again (rate limits reset quickly)\n3. **Get a free Groq API key** at console.groq.com (30 requests/min)\n\nSelected text: "${selectedText}"`;
  }

  // --- CHAT LOGIC ---
  if (chatSend && chatInput) {
    chatSend.addEventListener("click", (e) => {
      e.stopPropagation();
      sendChat();
    });
    chatInput.addEventListener("keypress", (e) => {
      e.stopPropagation(); // Stop keypress from triggering other listeners
      if (e.key === "Enter") sendChat();
    });
    // Prevent taps on input from closing the popup
    chatInput.addEventListener("mouseup", (e) => e.stopPropagation());
    chatInput.addEventListener("touchend", (e) => e.stopPropagation());
  }

  async function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    chatHistory.push({ role: "user", text: msg });
    renderChat();
    chatInput.value = "";

    // Disable input while loading
    chatInput.disabled = true;
    chatSend.disabled = true;

    // Show loading indicator
    chatHistory.push({ role: "loading", text: "Thinking..." });
    renderChat();

    const contextPrompt = `Context: "${selectedText}". User Question: ${msg}. Answer simply in 2-3 sentences.`;
    const response = await callAI(contextPrompt);

    // Remove loading indicator
    chatHistory = chatHistory.filter((m) => m.role !== "loading");

    chatHistory.push({ role: "model", text: response });
    renderChat();

    // Re-enable input
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }

  function renderChat() {
    if (!chatMessages) return;
    chatMessages.innerHTML = chatHistory
      .map((m) => {
        if (m.role === "loading") {
          return `<div class="chat-bubble chat-ai chat-loading">
            <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
            <span style="margin-left: 0.5rem; font-size: 0.85rem; color: #64748b;">${m.text}</span>
          </div>`;
        }
        return `<div class="chat-bubble ${
          m.role === "user" ? "chat-user" : "chat-ai"
        } markdown-body">${
          m.role === "user" ? m.text : marked.parse(m.text)
        }</div>`;
      })
      .join("");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- ANIMATION OBSERVER ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

  // --- SCROLL NAV HIGHLIGHTER ---
  const navSections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  if (navSections.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let id = entry.target.id;
            navLinks.forEach((link) => link.classList.remove("active"));
            const activeLink = document.querySelector(
              `.nav-link[href="#${id}"]`
            );
            if (activeLink) activeLink.classList.add("active");
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.4 }
    );
    navSections.forEach((sec) => navObserver.observe(sec));
  }

  // --- CHAPTER PROGRESS TRACKING ---
  function initProgressTracking() {
    // Get current chapter from URL
    const currentPage = window.location.pathname.split("/").pop();
    if (!currentPage.includes("chapter")) return;

    const chapterMatch = currentPage.match(/chapter(\d+)/);
    if (!chapterMatch) return;

    const chapterNum = parseInt(chapterMatch[1]);

    // Load progress from localStorage
    let progress = JSON.parse(
      localStorage.getItem("chaptersCompleted") || "[]"
    );

    // Track scroll depth for current chapter
    let maxScroll = 0;
    window.addEventListener("scroll", () => {
      const scrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      maxScroll = Math.max(maxScroll, scrollPercent);

      // Mark as completed if scrolled past 80%
      if (maxScroll > 80 && !progress.includes(chapterNum)) {
        progress.push(chapterNum);
        localStorage.setItem("chaptersCompleted", JSON.stringify(progress));
        showCompletionBadge();
      }
    });
  }

  function showCompletionBadge() {
    const badge = document.createElement("div");
    badge.className = "completion-badge";
    badge.innerHTML = "✓ Chapter completed!";
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
      z-index: 9999;
      animation: slideIn 0.5s ease;
    `;
    document.body.appendChild(badge);
    setTimeout(() => {
      badge.style.animation = "slideOut 0.5s ease";
      setTimeout(() => badge.remove(), 500);
    }, 3000);
  }

  // Display progress on home page
  function displayProgressOnHome() {
    const progressBar = document.getElementById("overall-progress");
    if (!progressBar) return;

    const progress = JSON.parse(
      localStorage.getItem("chaptersCompleted") || "[]"
    );
    const totalChapters = 18;
    const percentage = Math.round((progress.length / totalChapters) * 100);

    progressBar.innerHTML = `
      <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 1.5rem; border-radius: 16px; color: white; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span style="font-weight: 600; font-size: 1rem;">Your Progress</span>
          <span style="font-weight: 700; font-size: 1.25rem;">${progress.length}/${totalChapters}</span>
        </div>
        <div style="background: rgba(255,255,255,0.2); height: 12px; border-radius: 6px; overflow: hidden;">
          <div style="background: white; height: 100%; width: ${percentage}%; transition: width 0.5s ease; border-radius: 6px;"></div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.875rem; opacity: 0.9;">${percentage}% Complete</div>
      </div>
    `;
  }

  // Initialize based on page type
  if (window.location.pathname.includes("chapter")) {
    initProgressTracking();
  } else if (window.location.pathname.includes("index")) {
    displayProgressOnHome();
  }

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K for search (if we add it)
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.focus();
    }

    // Ctrl/Cmd + D for dark mode toggle
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      if (toggleBtn) toggleBtn.click();
    }

    // Ctrl/Cmd + , for settings
    if ((e.ctrlKey || e.metaKey) && e.key === ",") {
      e.preventDefault();
      const settingsPanel = document.getElementById("settings-panel");
      const settingsBackdrop = document.getElementById("settings-backdrop");
      if (settingsPanel) {
        settingsPanel.classList.toggle("visible");
        if (settingsBackdrop) settingsBackdrop.classList.toggle("visible");
      }
    }
  });

  // === SETTINGS DROPDOWN MENU ===
  const settingsBtnNav = document.getElementById("settings-btn-nav");
  const settingsDropdown = document.getElementById("settings-dropdown");
  const fontSizeBtns = document.querySelectorAll(".font-size-btn");
  const themeToggleBtns = document.querySelectorAll(".theme-toggle-btn");

  // Load settings from localStorage
  function loadSettings() {
    const settings = {
      fontSize: localStorage.getItem("fontSize") || "normal",
      theme: localStorage.getItem("theme") || "light",
    };
    return settings;
  }

  // Apply settings
  function applySettings() {
    const settings = loadSettings();

    // Font size
    htmlEl.classList.remove("font-small", "font-normal", "font-large");
    htmlEl.classList.add(`font-${settings.fontSize}`);

    // Update font buttons
    fontSizeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.size === settings.fontSize);
    });

    // Theme buttons
    themeToggleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === settings.theme);
    });
    setTheme(settings.theme === "dark");
  }

  // Toggle dropdown
  if (settingsBtnNav && settingsDropdown) {
    settingsBtnNav.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsDropdown.classList.toggle("visible");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !settingsDropdown.contains(e.target) &&
        !settingsBtnNav.contains(e.target)
      ) {
        settingsDropdown.classList.remove("visible");
      }
    });
  }

  // Font size controls
  fontSizeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const size = btn.dataset.size;
      localStorage.setItem("fontSize", size);
      applySettings();
    });
  });

  // Theme controls
  themeToggleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const theme = btn.dataset.theme;
      localStorage.setItem("theme", theme);
      applySettings();
    });
  });

  // Initialize settings on page load
  applySettings();
});
